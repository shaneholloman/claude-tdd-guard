# frozen_string_literal: true

require "rspec/core"

module TddGuardRspecHelpers
  # Create a mock RSpec example with the given attributes
  def build_example(description:, full_description:, file_path:)
    instance_double(
      RSpec::Core::Example,
      description: description,
      full_description: full_description,
      file_path: file_path
    )
  end

  # Create a mock notification wrapping an example
  def build_notification(example, exception: nil)
    notification = instance_double(RSpec::Core::Notifications::ExampleNotification, example: example)
    allow(notification).to receive(:exception).and_return(exception) if exception
    notification
  end

  # Create a mock failed notification with exception
  def build_failed_notification(example, message:)
    exception = instance_double(Exception, message: message)
    notification = instance_double(
      RSpec::Core::Notifications::FailedExampleNotification,
      example: example,
      exception: exception
    )
    notification
  end
end
