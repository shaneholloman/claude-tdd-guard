# frozen_string_literal: true

require "spec_helper"
require "json"
require "tmpdir"
require "fileutils"
require "open3"

# Integration test that runs a real RSpec process end-to-end to verify that the
# formatter captures unhandled errors correctly.
#
# This test exists to detect regressions if a future version of RSpec changes
# the output format of its internal ExceptionPresenter. The parser in
# TddGuardRspec::Formatter depends on that format, so a change there will cause
# this test to fail loudly rather than silently drop data.
RSpec.describe "unhandled errors integration", :integration do
  let(:repo_lib) { File.expand_path("../lib", __dir__) }

  def run_rspec(tmpdir, spec_body)
    spec_dir = File.join(tmpdir, "spec")
    FileUtils.mkdir_p(spec_dir)
    File.write(File.join(spec_dir, "hook_spec.rb"), spec_body)

    env = { "TDD_GUARD_PROJECT_ROOT" => tmpdir }
    cmd = [
      "bundle", "exec", "rspec",
      "-I", repo_lib,
      "--require", "tdd_guard_rspec/formatter",
      "--format", "TddGuardRspec::Formatter",
      "spec/hook_spec.rb"
    ]
    Open3.capture3(env, *cmd, chdir: tmpdir)

    json_path = File.join(tmpdir, ".claude", "tdd-guard", "data", "test.json")
    return nil unless File.exist?(json_path)
    JSON.parse(File.read(json_path))
  end

  it "captures an after(:suite) hook failure from a real RSpec run" do
    spec_body = <<~RUBY
      RSpec.configure do |c|
        c.after(:suite) { raise RuntimeError, "real integration failure" }
      end

      RSpec.describe "Integration" do
        it("passes") { expect(true).to be true }
      end
    RUBY

    Dir.mktmpdir do |tmpdir|
      data = run_rspec(tmpdir, spec_body)

      expect(data).not_to be_nil, "test.json was not written"
      expect(data).to have_key("unhandledErrors"),
        "unhandledErrors missing — RSpec's ExceptionPresenter output format may have changed"

      entry = data["unhandledErrors"].first
      expect(entry["name"]).to eq("RuntimeError")
      expect(entry["message"]).to eq("real integration failure")
    end
  end
end
