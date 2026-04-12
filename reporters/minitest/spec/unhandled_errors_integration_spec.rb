# frozen_string_literal: true

require "spec_helper"
require "json"
require "tmpdir"
require "fileutils"
require "open3"
require "rbconfig"

# Integration test that runs a real Ruby process end-to-end to verify that
# the autorun.rb hooks capture after_run block exceptions as unhandledErrors
# in test.json.
#
# This test exists to detect regressions if Minitest changes the at_exit
# ordering or after_run execution semantics. A failure here signals that
# the unhandled-error capture path is broken end-to-end, even if the unit
# specs still pass.
RSpec.describe "unhandled errors integration" do
  let(:repo_lib) { File.expand_path("../lib", __dir__) }

  def run_minitest(tmpdir, test_body)
    test_dir = File.join(tmpdir, "test")
    FileUtils.mkdir_p(test_dir)
    File.write(File.join(test_dir, "after_run_test.rb"), test_body)

    env = { "TDD_GUARD_PROJECT_ROOT" => tmpdir }
    cmd = [
      RbConfig.ruby,
      "-I", repo_lib,
      "-rtdd_guard_minitest/autorun",
      "test/after_run_test.rb"
    ]
    Open3.capture3(env, *cmd, chdir: tmpdir)

    json_path = File.join(tmpdir, ".claude", "tdd-guard", "data", "test.json")
    return nil unless File.exist?(json_path)
    JSON.parse(File.read(json_path))
  end

  it "captures an after_run error from a real ruby process" do
    test_body = <<~RUBY
      require "minitest/autorun"

      Minitest.after_run { raise RuntimeError, "after_run cleanup failed" }

      class CalculatorTest < Minitest::Test
        def test_should_add
          assert_equal 5, 2 + 3
        end
      end
    RUBY

    Dir.mktmpdir do |tmpdir|
      data = run_minitest(tmpdir, test_body)

      expect(data).not_to be_nil,
        "test.json was not written -- at_exit ordering may have changed"
      expect(data).to have_key("unhandledErrors"),
        "unhandledErrors missing -- after_run error capture may be broken"

      entry = data["unhandledErrors"].first
      expect(entry["name"]).to eq("RuntimeError")
      expect(entry["message"]).to eq("after_run cleanup failed")

      # Tests themselves should still appear as passed
      tests = data["testModules"].flat_map { |m| m["tests"] }
      expect(tests[0]["state"]).to eq("passed")
    end
  end

  it "does not add unhandledErrors when after_run succeeds" do
    test_body = <<~RUBY
      require "minitest/autorun"

      Minitest.after_run { $stdout.puts "clean teardown" }

      class CalculatorTest < Minitest::Test
        def test_should_add
          assert_equal 5, 2 + 3
        end
      end
    RUBY

    Dir.mktmpdir do |tmpdir|
      data = run_minitest(tmpdir, test_body)

      expect(data).not_to be_nil, "test.json should still be written via the normal report path"
      expect(data).not_to have_key("unhandledErrors")

      tests = data["testModules"].flat_map { |m| m["tests"] }
      expect(tests[0]["state"]).to eq("passed")
    end
  end
end
