# frozen_string_literal: true

require "spec_helper"
require "helpers"
require "json"
require "tmpdir"
require "fileutils"

RSpec.describe TddGuardRspec::Formatter do
  include TddGuardRspecHelpers

  let(:output) { StringIO.new }
  let(:formatter) { described_class.new(output) }

  describe "#initialize" do
    it "creates empty test results" do
      expect(formatter.instance_variable_get(:@test_results)).to eq([])
    end

    it "sets default storage dir" do
      expect(formatter.instance_variable_get(:@storage_dir)).to eq(".claude/tdd-guard/data")
    end
  end

  describe "#example_passed" do
    it "captures passed test result" do
      example = build_example(
        description: "does something",
        full_description: "MyClass does something",
        file_path: "./spec/my_class_spec.rb"
      )
      notification = build_notification(example)

      formatter.example_passed(notification)

      results = formatter.instance_variable_get(:@test_results)
      expect(results.length).to eq(1)
      expect(results[0]).to eq(
        "name" => "does something",
        "fullName" => "spec/my_class_spec.rb::MyClass does something",
        "state" => "passed"
      )
    end
  end

  describe "#example_failed" do
    it "captures failed test result with error message" do
      example = build_example(
        description: "raises error",
        full_description: "MyClass raises error",
        file_path: "./spec/my_class_spec.rb"
      )
      notification = build_failed_notification(example, message: "expected true, got false")

      formatter.example_failed(notification)

      results = formatter.instance_variable_get(:@test_results)
      expect(results.length).to eq(1)
      expect(results[0]).to eq(
        "name" => "raises error",
        "fullName" => "spec/my_class_spec.rb::MyClass raises error",
        "state" => "failed",
        "errors" => [{ "message" => "expected true, got false" }]
      )
    end
  end

  describe "#example_pending" do
    it "captures pending test as skipped" do
      example = build_example(
        description: "is pending",
        full_description: "MyClass is pending",
        file_path: "./spec/my_class_spec.rb"
      )
      notification = build_notification(example)

      formatter.example_pending(notification)

      results = formatter.instance_variable_get(:@test_results)
      expect(results.length).to eq(1)
      expect(results[0]["state"]).to eq("skipped")
    end
  end

  describe "#close" do
    it "saves empty testModules when no tests ran" do
      Dir.mktmpdir do |tmpdir|
        storage_dir = File.join(tmpdir, ".claude/tdd-guard/data")
        formatter.instance_variable_set(:@storage_dir, storage_dir)

        formatter.close(double("notification"))

        json_path = File.join(storage_dir, "test.json")
        data = JSON.parse(File.read(json_path))
        expect(data["testModules"]).to eq([])
      end
    end

    it "saves results grouped by module to JSON" do
      Dir.mktmpdir do |tmpdir|
        storage_dir = File.join(tmpdir, ".claude/tdd-guard/data")
        formatter.instance_variable_set(:@storage_dir, storage_dir)

        formatter.instance_variable_set(:@test_results, [
          {
            "name" => "test_one",
            "fullName" => "spec/model_spec.rb::Model test_one",
            "state" => "passed"
          },
          {
            "name" => "test_two",
            "fullName" => "spec/model_spec.rb::Model test_two",
            "state" => "failed",
            "errors" => [{ "message" => "Error" }]
          },
          {
            "name" => "test_other",
            "fullName" => "spec/service_spec.rb::Service test_other",
            "state" => "passed"
          }
        ])

        formatter.close(double("notification"))

        json_path = File.join(storage_dir, "test.json")
        expect(File.exist?(json_path)).to be true

        data = JSON.parse(File.read(json_path))
        expect(data).to have_key("testModules")
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

  describe "name extraction" do
    it "uses example.description as name" do
      example = build_example(
        description: "returns correct value",
        full_description: "Calculator returns correct value",
        file_path: "./spec/calculator_spec.rb"
      )
      notification = build_notification(example)

      formatter.example_passed(notification)

      results = formatter.instance_variable_get(:@test_results)
      expect(results[0]["name"]).to eq("returns correct value")
    end
  end

  describe "fullName format" do
    it "uses file_path::full_description as fullName" do
      example = build_example(
        description: "works",
        full_description: "Widget works",
        file_path: "./spec/widget_spec.rb"
      )
      notification = build_notification(example)

      formatter.example_passed(notification)

      results = formatter.instance_variable_get(:@test_results)
      expect(results[0]["fullName"]).to eq("spec/widget_spec.rb::Widget works")
    end
  end

  describe "path handling" do
    it "strips leading ./ from file path" do
      example = build_example(
        description: "test",
        full_description: "test",
        file_path: "./spec/foo_spec.rb"
      )
      notification = build_notification(example)

      formatter.example_passed(notification)

      results = formatter.instance_variable_get(:@test_results)
      expect(results[0]["fullName"]).to start_with("spec/foo_spec.rb")
    end

    it "handles file path without leading ./" do
      example = build_example(
        description: "test",
        full_description: "test",
        file_path: "spec/bar_spec.rb"
      )
      notification = build_notification(example)

      formatter.example_passed(notification)

      results = formatter.instance_variable_get(:@test_results)
      expect(results[0]["fullName"]).to eq("spec/bar_spec.rb::test")
    end
  end

  describe "storage directory determination" do
    it "uses default relative path when no env var set" do
      ClimateControl.modify("TDD_GUARD_PROJECT_ROOT" => nil) do
        f = described_class.new(StringIO.new)
        expect(f.instance_variable_get(:@storage_dir)).to eq(".claude/tdd-guard/data")
      end
    end

    it "rejects relative path in env var" do
      ClimateControl.modify("TDD_GUARD_PROJECT_ROOT" => "../some/path") do
        f = described_class.new(StringIO.new)
        expect(f.instance_variable_get(:@storage_dir)).to eq(".claude/tdd-guard/data")
      end
    end

    it "rejects project root when cwd is outside" do
      ClimateControl.modify("TDD_GUARD_PROJECT_ROOT" => "/other/project") do
        f = described_class.new(StringIO.new)
        expect(f.instance_variable_get(:@storage_dir)).to eq(".claude/tdd-guard/data")
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
            f = described_class.new(StringIO.new)
            expect(f.instance_variable_get(:@storage_dir)).to eq(".claude/tdd-guard/data")
          end
        end
      end
    end

    it "uses project root from env var when valid" do
      Dir.mktmpdir do |tmpdir|
        real_tmpdir = File.realpath(tmpdir)
        Dir.chdir(real_tmpdir) do
          ClimateControl.modify("TDD_GUARD_PROJECT_ROOT" => real_tmpdir) do
            f = described_class.new(StringIO.new)
            expect(f.instance_variable_get(:@storage_dir)).to eq(
              File.join(real_tmpdir, ".claude/tdd-guard/data")
            )
          end
        end
      end
    end
  end
end
