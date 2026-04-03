# TDD Guard RSpec Reporter

RSpec formatter that captures test results for TDD Guard validation.

## Requirements

- Ruby 3.3+
- RSpec 3.0+
- [TDD Guard](https://github.com/nizos/tdd-guard)

## Installation

Install TDD Guard by following the instructions in the [TDD Guard repository](https://github.com/nizos/tdd-guard).

Add the reporter to your Gemfile:

```ruby
gem "tdd-guard-rspec"
```

Or install directly:

```bash
gem install tdd-guard-rspec
```

## Usage

Run RSpec with the TDD Guard formatter:

```bash
rspec --format TddGuardRspec::Formatter
```

Or add it to your `.rspec` file:

```
--format TddGuardRspec::Formatter
```

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
