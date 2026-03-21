# TDD Guard Plugin

Automated Test-Driven Development enforcement for Claude Code.

When Claude Code attempts to edit or write files, TDD Guard validates that changes follow TDD principles — blocking operations that skip tests or over-implement.

## Setup

After installing the plugin, run the setup skill to configure a test reporter for your project:

```
/tdd-guard:setup
```

This detects your test framework and configures the appropriate [reporter](https://github.com/nizos/tdd-guard).

**Note:** You may need to restart your terminal session or IDE extension for the setup skill to appear.

## What's included

- **Hooks** — Automatically registered on install. Validate file operations, handle `tdd-guard on/off` commands, and manage session state.
- **Setup skill** — `/tdd-guard:setup` detects your test framework and configures the reporter.

## Requirements

- Node.js 22+
- A supported test framework

## Learn more

- [Documentation](https://github.com/nizos/tdd-guard)
- [Configuration options](https://github.com/nizos/tdd-guard/blob/main/docs/configuration.md)
- [Custom TDD rules](https://github.com/nizos/tdd-guard/blob/main/docs/custom-instructions.md)
