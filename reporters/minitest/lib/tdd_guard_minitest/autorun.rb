# frozen_string_literal: true

# Entry point used to guarantee that the tdd-guard-minitest reporter is in
# place before the user's test file is loaded.
#
# Three hooks are registered here, ordered by when they *fire* (LIFO):
#
# 1. Load-error at_exit (registered last, fires first):
#    Intercepts unhandled exceptions raised while loading the user's test
#    file (typically a LoadError from a missing require).
#
# 2. Minitest's own at_exit hooks (registered by require "minitest/autorun"):
#    Outer hook runs tests and calls reporter.report.
#    Inner hook (registered during the outer hook) runs after_run blocks.
#
# 3. Post-after_run at_exit (registered first, fires last):
#    If any wrapped after_run blocks raised, patches test.json with the
#    captured unhandledErrors.
#
# Between hooks 1 and 3, Minitest.after_run is patched so that each
# user-registered block is wrapped in a begin/rescue that captures
# exceptions into TddGuardMinitest.unhandled_errors before re-raising.
#
# Usage:
#
#   ruby -rtdd_guard_minitest/autorun path/to/test.rb
#
# or from test/test_helper.rb:
#
#   require "tdd_guard_minitest/autorun"

require "tdd_guard_minitest/reporter"

# Hook 3 (fires last): patch test.json with any captured after_run errors.
# Registered before Minitest's at_exit so it fires after all Minitest hooks.
at_exit do
  errors = TddGuardMinitest.unhandled_errors
  next if errors.empty?

  TddGuardMinitest::Reporter.append_unhandled_errors(errors)
end

require "minitest/autorun"

# Ensure the plugin is registered even when Minitest does not call
# load_plugins automatically (Minitest 6+). In Minitest 5, load_plugins
# is called during Minitest.run and discovers the plugin via
# Gem.find_files; this explicit registration is harmless in that case
# because init_plugins skips duplicate names.
require "minitest/tdd_guard_plugin"
Minitest.extensions << "tdd_guard" unless Minitest.extensions.include?("tdd_guard")

# Wrap Minitest.after_run so that each block registered by user code or
# plugins is intercepted. Captured exceptions are stored for the post-
# after_run at_exit hook above while still re-raising to preserve
# Minitest's default behavior.
original_after_run = Minitest.method(:after_run)
Minitest.define_singleton_method(:after_run) do |&block|
  original_after_run.call do
    begin
      block.call
    rescue Exception => e # rubocop:disable Lint/RescueException
      TddGuardMinitest.unhandled_errors << e unless e.is_a?(SystemExit)
      raise
    end
  end
end

# Hook 1 (fires first): capture load errors before Minitest runs.
at_exit do
  exc = $!
  next if exc.nil?
  next if exc.is_a?(SystemExit)

  TddGuardMinitest::Reporter.handle_load_error(exc)
end
