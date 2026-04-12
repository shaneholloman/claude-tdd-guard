# frozen_string_literal: true

# Test artifact: registers a Minitest.after_run block that raises an error.
# Used by the unhandled errors integration test to verify that exceptions
# from after_run blocks are captured in test.json as unhandledErrors.

require "minitest/autorun"

Minitest.after_run { raise RuntimeError, "after_run cleanup failed" }

class CalculatorTest < Minitest::Test
  def test_should_add
    assert_equal 5, 2 + 3
  end
end
