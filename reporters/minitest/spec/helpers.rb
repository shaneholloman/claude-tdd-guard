# frozen_string_literal: true

require "minitest"

module TddGuardMinitestHelpers
  # Create a mock Minitest result with the given attributes
  def build_result(
    name: "test_example",
    klass: "ExampleTest",
    source_location: ["test/example_test.rb", 5],
    failures: [],
    assertions: 1,
    time: 0.001
  )
    result = instance_double(
      Minitest::Result,
      name: name,
      klass: klass,
      source_location: source_location,
      failures: failures,
      assertions: assertions,
      time: time,
      passed?: failures.empty?,
      skipped?: failures.any? { |f| f.is_a?(Minitest::Skip) },
      respond_to?: true
    )
    # Override passed? when skipped
    if failures.any? { |f| f.is_a?(Minitest::Skip) }
      allow(result).to receive(:passed?).and_return(false)
    end
    allow(result).to receive(:respond_to?).with(:assertions).and_return(true)
    result
  end

  # Create a Minitest::Assertion failure
  def build_assertion_failure(message:, backtrace: nil)
    failure = Minitest::Assertion.new(message)
    failure.set_backtrace(backtrace) if backtrace
    failure
  end

  # Create a Minitest::UnexpectedError failure
  def build_unexpected_error(error_class: RuntimeError, message:, backtrace: nil)
    original = error_class.new(message)
    original.set_backtrace(backtrace || [])
    Minitest::UnexpectedError.new(original)
  end

  # Create a Minitest::Skip failure
  def build_skip(message: "skipped")
    Minitest::Skip.new(message)
  end
end
