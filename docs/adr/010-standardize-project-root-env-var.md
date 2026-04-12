# ADR-010: Standardize TDD_GUARD_PROJECT_ROOT Across All Reporters

## Status

Accepted

## Context

TDD Guard reporters write test results to `.claude/tdd-guard/data/test.json` under a configured project root. The project root must point to a stable location regardless of where the test runner is invoked — otherwise, results land in the wrong directory and the validation hook does not find them.

ADR-009 relaxed the requirement that the project root be an absolute path. This unblocked shared repositories and Docker setups, but relative paths resolve against the process cwd at runtime. When an agent runs tests from a subdirectory, a relative path resolves to the wrong directory.

Not all configuration formats can compute paths at load time. An environment variable sidesteps this limitation — the value is set once per machine or environment and always produces the correct path. Some reporters already support `TDD_GUARD_PROJECT_ROOT`, but the coverage is incomplete.

Defaulting to cwd when no project root is configured is problematic — it silently writes results to the wrong location when tests run from a subdirectory, which is the exact scenario the project root setting was designed to prevent.

## Decision

All reporters will support `TDD_GUARD_PROJECT_ROOT` as an environment variable for configuring the project root. The precedence chain is:

- **Explicit option** (CLI flag, config file parameter, constructor option) takes highest priority.
- **`TDD_GUARD_PROJECT_ROOT` environment variable** is used when no explicit option is provided.
- **Error** when neither is configured. Reporters will not silently default to cwd.

Removing the silent cwd fallback is a breaking change. This is intentional — silent misconfiguration is worse than an upfront error asking the user to set the project root.

Claude Code sets `CLAUDE_PROJECT_DIR` for hook commands, but this variable is not currently available to Bash subprocesses where reporters run. If it becomes available in the future, reporters can read it as an additional fallback between `TDD_GUARD_PROJECT_ROOT` and the error.

This ADR does not change the hardcoded data directory subpath (`.claude/tdd-guard/data`, per ADR-003) or the validation of `CLAUDE_PROJECT_DIR` in the CLI/hook (per ADR-005).

## Out of Scope

- **Whether to keep, modify, or remove the cwd-within-root sanity check** — deferred per ADR-009.
- **Integration with `CLAUDE_PROJECT_DIR`** — dependent on Claude Code exposing it to Bash subprocesses.

## Consequences

### Positive

- **Consistent configuration across all reporters.** One env var works for every language and framework, regardless of config format.
- **Per-machine configuration without repo changes.** Docker, shared repos, and CI each set the env var for their environment.
- **No silent misconfiguration.** Removing the cwd fallback prevents test results from landing in the wrong directory.

### Negative

- **Breaking change for zero-config users.** Users who relied on the cwd default will need to set `TDD_GUARD_PROJECT_ROOT` or pass an explicit option.

### Neutral

- **Existing env var and option users are unaffected.** The explicit option still takes precedence, and reporters that already read `TDD_GUARD_PROJECT_ROOT` see no change in behavior.
