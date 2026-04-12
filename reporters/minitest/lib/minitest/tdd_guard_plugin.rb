# frozen_string_literal: true

require "tdd_guard_minitest/reporter"

module Minitest
  def self.plugin_tdd_guard_init(options)
    # Guard against double initialization. In Minitest 5, load_plugins
    # may register "tdd_guard" in extensions even when autorun.rb has
    # already done so, causing init_plugins to call this method twice.
    return if reporter.reporters.any? { |r| r.is_a?(TddGuardMinitest::Reporter) }

    reporter << TddGuardMinitest::Reporter.new(options[:io], options)
  end
end
