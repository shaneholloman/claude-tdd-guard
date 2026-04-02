# frozen_string_literal: true

require "spec_helper"
require "helpers"
require "json"
require "tmpdir"
require "fileutils"

RSpec.describe TddGuardRspec::Formatter do
  include TddGuardRspecHelpers

  let(:output) { StringIO.new }
  let(:default_data_dir) { TddGuardRspec::Formatter::DEFAULT_DATA_DIR }

  # Helper: create a formatter with storage_dir pointing to a tmpdir
  def create_formatter_in(tmpdir)
    real_tmpdir = File.realpath(tmpdir)
    Dir.chdir(real_tmpdir) do
      ClimateControl.modify("TDD_GUARD_PROJECT_ROOT" => real_tmpdir) do
        yield described_class.new(StringIO.new), real_tmpdir
      end
    end
  end

  # Helper: run the full flow and return parsed JSON
  def run_and_read_json(formatter, storage_dir)
    formatter.close(double("notification"))
    json_path = File.join(storage_dir, default_data_dir, "test.json")
    JSON.parse(File.read(json_path))
  end

  # Helper: extract flat list of tests from JSON data
  def all_tests(data)
    data["testModules"].flat_map { |m| m["tests"] }
  end

  describe "#example_passed" do
    it "captures passed test result" do
      Dir.mktmpdir do |tmpdir|
        create_formatter_in(tmpdir) do |formatter, storage_dir|
          example = build_example(
            description: "does something",
            full_description: "MyClass does something",
            file_path: "./spec/my_class_spec.rb"
          )
          formatter.example_passed(build_notification(example))

          data = run_and_read_json(formatter, storage_dir)
          tests = all_tests(data)
          expect(tests.length).to eq(1)
          expect(tests[0]).to eq(
            "name" => "does something",
            "fullName" => "spec/my_class_spec.rb::MyClass does something",
            "state" => "passed"
          )
        end
      end
    end
  end

  describe "#example_failed" do
    it "captures failed test result with error message" do
      Dir.mktmpdir do |tmpdir|
        create_formatter_in(tmpdir) do |formatter, storage_dir|
          example = build_example(
            description: "raises error",
            full_description: "MyClass raises error",
            file_path: "./spec/my_class_spec.rb"
          )
          formatter.example_failed(build_failed_notification(example, message: "expected true, got false"))

          data = run_and_read_json(formatter, storage_dir)
          tests = all_tests(data)
          expect(tests.length).to eq(1)
          expect(tests[0]).to eq(
            "name" => "raises error",
            "fullName" => "spec/my_class_spec.rb::MyClass raises error",
            "state" => "failed",
            "errors" => [{ "message" => "expected true, got false" }]
          )
        end
      end
    end
  end

  describe "#example_pending" do
    it "captures pending test as skipped" do
      Dir.mktmpdir do |tmpdir|
        create_formatter_in(tmpdir) do |formatter, storage_dir|
          example = build_example(
            description: "is pending",
            full_description: "MyClass is pending",
            file_path: "./spec/my_class_spec.rb"
          )
          formatter.example_pending(build_notification(example))

          data = run_and_read_json(formatter, storage_dir)
          tests = all_tests(data)
          expect(tests.length).to eq(1)
          expect(tests[0]["state"]).to eq("skipped")
        end
      end
    end
  end

  describe "#close" do
    it "saves empty testModules when no tests ran" do
      Dir.mktmpdir do |tmpdir|
        create_formatter_in(tmpdir) do |formatter, storage_dir|
          data = run_and_read_json(formatter, storage_dir)
          expect(data["testModules"]).to eq([])
        end
      end
    end

    it "saves results grouped by module to JSON" do
      Dir.mktmpdir do |tmpdir|
        create_formatter_in(tmpdir) do |formatter, storage_dir|
          [
            { desc: "test_one", full: "Model test_one", file: "./spec/model_spec.rb", method: :example_passed },
            { desc: "test_two", full: "Model test_two", file: "./spec/model_spec.rb", method: :example_failed, error: "Error" },
            { desc: "test_other", full: "Service test_other", file: "./spec/service_spec.rb", method: :example_passed }
          ].each do |t|
            example = build_example(description: t[:desc], full_description: t[:full], file_path: t[:file])
            if t[:method] == :example_failed
              formatter.example_failed(build_failed_notification(example, message: t[:error]))
            else
              formatter.example_passed(build_notification(example))
            end
          end

          data = run_and_read_json(formatter, storage_dir)
          expect(data["testModules"].length).to eq(2)

          model_module = data["testModules"].find { |m| m["moduleId"] == "spec/model_spec.rb" }
          expect(model_module["tests"].length).to eq(2)
          expect(model_module["tests"][0]["name"]).to eq("test_one")

          service_module = data["testModules"].find { |m| m["moduleId"] == "spec/service_spec.rb" }
          expect(service_module["tests"].length).to eq(1)
          expect(service_module["tests"][0]["name"]).to eq("test_other")
        end
      end
    end
  end

  describe "name extraction" do
    it "uses example.description as name" do
      Dir.mktmpdir do |tmpdir|
        create_formatter_in(tmpdir) do |formatter, storage_dir|
          example = build_example(
            description: "returns correct value",
            full_description: "Calculator returns correct value",
            file_path: "./spec/calculator_spec.rb"
          )
          formatter.example_passed(build_notification(example))

          data = run_and_read_json(formatter, storage_dir)
          expect(all_tests(data)[0]["name"]).to eq("returns correct value")
        end
      end
    end
  end

  describe "fullName format" do
    it "uses file_path::full_description as fullName" do
      Dir.mktmpdir do |tmpdir|
        create_formatter_in(tmpdir) do |formatter, storage_dir|
          example = build_example(
            description: "works",
            full_description: "Widget works",
            file_path: "./spec/widget_spec.rb"
          )
          formatter.example_passed(build_notification(example))

          data = run_and_read_json(formatter, storage_dir)
          expect(all_tests(data)[0]["fullName"]).to eq("spec/widget_spec.rb::Widget works")
        end
      end
    end
  end

  describe "path handling" do
    it "strips leading ./ from file path" do
      Dir.mktmpdir do |tmpdir|
        create_formatter_in(tmpdir) do |formatter, storage_dir|
          example = build_example(
            description: "test",
            full_description: "test",
            file_path: "./spec/foo_spec.rb"
          )
          formatter.example_passed(build_notification(example))

          data = run_and_read_json(formatter, storage_dir)
          expect(all_tests(data)[0]["fullName"]).to start_with("spec/foo_spec.rb")
        end
      end
    end

    it "handles file path without leading ./" do
      Dir.mktmpdir do |tmpdir|
        create_formatter_in(tmpdir) do |formatter, storage_dir|
          example = build_example(
            description: "test",
            full_description: "test",
            file_path: "spec/bar_spec.rb"
          )
          formatter.example_passed(build_notification(example))

          data = run_and_read_json(formatter, storage_dir)
          expect(all_tests(data)[0]["fullName"]).to eq("spec/bar_spec.rb::test")
        end
      end
    end
  end

  describe "storage directory determination" do
    it "uses default relative path when no env var set" do
      Dir.mktmpdir do |tmpdir|
        real_tmpdir = File.realpath(tmpdir)
        Dir.chdir(real_tmpdir) do
          ClimateControl.modify("TDD_GUARD_PROJECT_ROOT" => nil) do
            formatter = described_class.new(StringIO.new)
            formatter.close(double("notification"))

            json_path = File.join(default_data_dir, "test.json")
            expect(File.exist?(json_path)).to be true
          end
        end
      end
    end

    it "rejects relative path in env var" do
      Dir.mktmpdir do |tmpdir|
        real_tmpdir = File.realpath(tmpdir)
        Dir.chdir(real_tmpdir) do
          ClimateControl.modify("TDD_GUARD_PROJECT_ROOT" => "../some/path") do
            formatter = described_class.new(StringIO.new)
            formatter.close(double("notification"))

            json_path = File.join(default_data_dir, "test.json")
            expect(File.exist?(json_path)).to be true
            # Should NOT have written to the project root path
            expect(File.exist?(File.join("../some/path", default_data_dir, "test.json"))).to be false
          end
        end
      end
    end

    it "rejects project root when cwd is outside" do
      Dir.mktmpdir do |tmpdir|
        real_tmpdir = File.realpath(tmpdir)
        Dir.chdir(real_tmpdir) do
          ClimateControl.modify("TDD_GUARD_PROJECT_ROOT" => "/other/project") do
            formatter = described_class.new(StringIO.new)
            formatter.close(double("notification"))

            json_path = File.join(default_data_dir, "test.json")
            expect(File.exist?(json_path)).to be true
          end
        end
      end
    end

    it "rejects project root that is a prefix of cwd but not an ancestor" do
      Dir.mktmpdir do |tmpdir|
        real_tmpdir = File.realpath(tmpdir)
        project_dir = File.join(real_tmpdir, "foo")
        similar_dir = File.join(real_tmpdir, "foobar")
        FileUtils.mkdir_p(similar_dir)

        Dir.chdir(similar_dir) do
          ClimateControl.modify("TDD_GUARD_PROJECT_ROOT" => project_dir) do
            formatter = described_class.new(StringIO.new)
            formatter.close(double("notification"))

            json_path = File.join(default_data_dir, "test.json")
            expect(File.exist?(json_path)).to be true
            # Should NOT have written under the project root
            expect(File.exist?(File.join(project_dir, default_data_dir, "test.json"))).to be false
          end
        end
      end
    end

    it "uses project root from env var when valid" do
      Dir.mktmpdir do |tmpdir|
        real_tmpdir = File.realpath(tmpdir)
        Dir.chdir(real_tmpdir) do
          ClimateControl.modify("TDD_GUARD_PROJECT_ROOT" => real_tmpdir) do
            formatter = described_class.new(StringIO.new)
            formatter.close(double("notification"))

            json_path = File.join(real_tmpdir, default_data_dir, "test.json")
            expect(File.exist?(json_path)).to be true
          end
        end
      end
    end
  end
end
