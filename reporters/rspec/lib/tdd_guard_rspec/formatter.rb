# frozen_string_literal: true

require "json"
require "fileutils"
require "rspec/core/formatters/base_formatter"

module TddGuardRspec
  # RSpec formatter that captures test results for TDD Guard validation.
  # Mirrors the pytest reporter's single-class architecture.
  class Formatter < RSpec::Core::Formatters::BaseFormatter
    RSpec::Core::Formatters.register self,
      :example_passed,
      :example_failed,
      :example_pending,
      :close

    DEFAULT_DATA_DIR = ".claude/tdd-guard/data"

    def initialize(output)
      super(output)
      @test_results = []
      @storage_dir = determine_storage_dir
    end

    def example_passed(notification)
      record_example(notification.example, "passed")
    end

    def example_failed(notification)
      example = notification.example
      errors = [{ "message" => notification.exception.message }]
      record_example(example, "failed", errors)
    end

    def example_pending(notification)
      record_example(notification.example, "skipped")
    end

    def close(_notification)
      modules_map = {}
      @test_results.each do |test|
        module_path = test["fullName"].split("::").first
        modules_map[module_path] ||= { "moduleId" => module_path, "tests" => [] }
        modules_map[module_path]["tests"] << test
      end

      result = { "testModules" => modules_map.values }

      FileUtils.mkdir_p(@storage_dir)
      File.write(File.join(@storage_dir, "test.json"), JSON.pretty_generate(result))
    end

    private

    def record_example(example, state, errors = nil)
      file_path = example.file_path.sub(%r{^\./}, "")
      test = {
        "name" => example.description,
        "fullName" => "#{file_path}::#{example.full_description}",
        "state" => state
      }
      test["errors"] = errors if errors
      @test_results << test
    end

    def determine_storage_dir
      project_root = ENV["TDD_GUARD_PROJECT_ROOT"]
      return DEFAULT_DATA_DIR unless project_root && !project_root.empty?
      return DEFAULT_DATA_DIR unless absolute_path?(project_root)
      return DEFAULT_DATA_DIR unless cwd_within?(project_root)

      File.join(project_root, DEFAULT_DATA_DIR)
    end

    def absolute_path?(path)
      File.absolute_path?(path)
    end

    def cwd_within?(root)
      expanded = File.expand_path(root)
      cwd = Dir.pwd
      cwd == expanded || cwd.start_with?("#{expanded}/")
    end
  end
end
