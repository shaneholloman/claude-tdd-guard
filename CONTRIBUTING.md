# Contributing

Thank you for your interest in contributing to TDD Guard. Contributions of all kinds are welcome and appreciated, whether it's fixing a bug, improving documentation, or proposing a new feature.

These guidelines exist to help your contributions land smoothly and increase the chances of your work being merged quickly.

## Before You Start

If you'd like to add a feature, add a reporter, change existing behavior, or make a significant refactor, please open an issue first so we can discuss the approach together. This helps us align on direction early and avoids situations where you invest significant effort on something that may not fit the project's current priorities.

Bug fixes and small improvements are welcome as direct pull requests, though opening an issue first is still appreciated so we can track the change.

## Pull Requests

Each pull request should address a single concern. A PR that fixes a bug should not also refactor unrelated code or update formatting elsewhere. If you find additional changes worth making along the way, please open a separate PR for those.

Use meaningful titles that describe what the change accomplishes. The description should explain what the PR introduces and why. For significant design decisions, include an [Architecture Decision Record](docs/adr/).

### Core Requirements

Implementation must be test driven with all relevant and affected tests passing. Run linting and formatting (`npm run checks`) and ensure the build succeeds (`npm run build`).

### Commit Messages

Use conventional commits and communicate the why, not just what. Focus on the reasoning behind changes rather than describing what was changed.

### Reporter Contributions

Project root path can be specified so that tests can be run from any directory in the project. For security, validate that the project root path is absolute and that it is the current working directory or an ancestor of it. Relevant cases must be added to reporter integration tests.

#### Build Error Handling for Compiled and Typed Languages

Reporters for compiled languages must produce synthetic test failures for compilation errors. When a build fails before tests can run, the reporter should emit a failed test entry with the compiler diagnostics as error messages. Without this, compilation failures produce empty output and the validation agent has no signal that something is broken. The Go and Rust reporters serve as reference implementations.

If your reporter introduces a new language, update the pre-filter's file type detection and test counter so that single test additions can be allowed through without full validation.

## Style Guidelines

No emojis in code or documentation. Avoid generic or boilerplate content. Be deliberate and intentional. Keep it clean and concise.

## Development

- [Development Guide](DEVELOPMENT.md) - Setup instructions and testing
- [Dev Container setup](.devcontainer/README.md) - Consistent development environment
