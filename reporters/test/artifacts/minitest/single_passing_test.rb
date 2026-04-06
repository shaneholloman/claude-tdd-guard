# frozen_string_literal: true

require "minitest/autorun"

class CalculatorTest < Minitest::Test
  def test_should_add_numbers_correctly
    assert_equal 5, 2 + 3
  end
end
