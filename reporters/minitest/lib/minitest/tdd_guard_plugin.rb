# frozen_string_literal: true

require "tdd_guard_minitest/reporter"

module Minitest
  def self.plugin_tdd_guard_init(options)
    reporter << TddGuardMinitest::Reporter.new(options[:io], options)
  end
end
