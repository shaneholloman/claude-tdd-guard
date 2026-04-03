# frozen_string_literal: true

require "rspec/core"

module TddGuardRspecHelpers
  # Create a mock RSpec example with the given attributes
  def build_example(
    description: "example",
    full_description: "Example example",
    file_path: "./spec/example_spec.rb"
  )
    instance_double(
      RSpec::Core::Example,
      description: description,
      full_description: full_description,
      file_path: file_path
    )
  end

  # Create a mock notification wrapping an example
  def build_notification(example)
    instance_double(RSpec::Core::Notifications::ExampleNotification, example: example)
  end

  # Create a mock failed notification with exception
  def build_failed_notification(example, message:, backtrace: nil)
    exception = instance_double(Exception, message: message, backtrace: backtrace)
    notification = instance_double(
      RSpec::Core::Notifications::FailedExampleNotification,
      example: example,
      exception: exception
    )
    notification
  end

  # Create a mock message notification
  def build_message_notification(message)
    instance_double(RSpec::Core::Notifications::MessageNotification, message: message)
  end

  # Create a mock summary notification
  def build_summary_notification(errors_outside_of_examples_count:)
    instance_double(
      RSpec::Core::Notifications::SummaryNotification,
      errors_outside_of_examples_count: errors_outside_of_examples_count
    )
  end
end
