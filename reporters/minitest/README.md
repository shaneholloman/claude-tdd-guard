# TDD Guard Minitest Reporter

Minitest reporter that captures test results for TDD Guard validation.

## Requirements

- Ruby 3.3+
- Minitest 5.0+
- [TDD Guard](https://github.com/nizos/tdd-guard)

## Installation

Install TDD Guard by following the instructions in the [TDD Guard repository](https://github.com/nizos/tdd-guard).

Add the reporter to your Gemfile:

```ruby
gem "tdd-guard-minitest"
```

Or install directly:

```bash
gem install tdd-guard-minitest
```

## Usage

Run Minitest with the TDD Guard reporter:

```bash
ruby -r tdd_guard_minitest/reporter test/my_test.rb
```

The reporter registers itself as a Minitest plugin and activates automatically when required.

## Configuration

### Project Root Configuration

Set the `TDD_GUARD_PROJECT_ROOT` environment variable to your project root:

```bash
export TDD_GUARD_PROJECT_ROOT="/absolute/path/to/project/root"
```

### Configuration Rules

- Path must be absolute
- Current directory must be within the configured project root
- Falls back to current directory if configuration is invalid

## Development

```bash
bundle install
bundle exec rspec
```

## More Information

- Test results are saved to `.claude/tdd-guard/data/test.json`
- See [TDD Guard documentation](https://github.com/nizos/tdd-guard) for complete setup

## License

MIT
