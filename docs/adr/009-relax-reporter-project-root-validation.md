# ADR-009: Relax Reporter Project Root Path Validation

## Status

Accepted

## Context

TDD Guard reporters write test results to `.claude/tdd-guard/data/test.json` under a configured project root. The project root setting exists because test runners are often invoked from a subdirectory — directly by developers, by Claude Code, and especially in monorepo and workspace setups. Without it, results land relative to the runner's cwd and the validation hook does not find them.

Reporters currently require this path to be **absolute**, and the PHPUnit reporter additionally rejects any path containing `..`. These checks were added early in the project's life, when the agentic-tool ecosystem was still young and there was little established guidance on where defensive layers belonged. Erring on the side of stricter validation was reasonable in that moment.

The ecosystem has since matured. Claude Code and comparable harnesses now provide first-class permission systems and sandboxing; containerized development environments such as devcontainers are a standard isolation pattern; OS-level isolation tooling is widely documented and available. Users running agents on sensitive work are expected to combine these layers as defense-in-depth. Concerns about a tool process writing outside its project are addressed there — at the harness, the container, and the OS — rather than at the application's input validation. TDD Guard's string-level checks on the project root have become atypical for tools at this layer, and the extra caution they represent is now out of step with where these concerns are expected to live.

That extra caution has a real cost in everyday use:

- **Shared repositories** — paths differ between developer machines, so a checked-in absolute path only works for one developer.
- **Docker** — host and container paths do not match.

Issue #139 surfaced this concretely for PHPUnit in a shared/Docker context.

This ADR is **reporter-side only**. The strict validation of `CLAUDE_PROJECT_DIR` in the main `tdd-guard` CLI/hook (ADR-005) is a distinct concern from the user-facing reporter configuration this ADR addresses, and remains unchanged.

## Decision

Reporters will accept relative paths and paths containing `..` for their project root configuration:

- **Drop the absolute-path requirement.** Relative paths are resolved against the reporter process's current working directory using the language's standard path resolution.
- **Drop the `..` rejection** (currently only enforced by PHPUnit).
- **Resolve before validating.** Any remaining checks operate on the resolved absolute path, not on the user-provided string.

This ADR does not change the hardcoded data directory subpath (`.claude/tdd-guard/data`, per ADR-003) or the validation of `CLAUDE_PROJECT_DIR` in the CLI/hook (per ADR-005).

## Out of Scope

The following are deliberately deferred to follow-up work:

- **Environment variable fallback (`TDD_GUARD_PROJECT_ROOT`)** for reporters that do not yet support it.
- **Whether to keep, modify, or remove the cwd-within-root sanity check** — left untouched by this ADR and revisited separately.
- **Loud-vs-silent failure behavior** — pytest, RSpec, and Minitest currently fall back silently when validation fails; whether to make this loud is a separate question.

## Consequences

### Positive

- **Unblocks shared repositories and Docker** — relative paths checked into the repo work regardless of where it is cloned or mounted.
- **Reduces configuration friction** — no per-developer overrides or gitignored entries needed for the project root setting alone.

### Negative

- **Loses the absolute-path requirement as a misconfiguration signal.** A user who passes an unintended path (e.g. a typo) will see results written there silently rather than getting an immediate format error from the reporter.

### Neutral

- **The hardcoded data directory remains.** Reporters still write to `.claude/tdd-guard/data` under the configured project root, with no user-controlled subpath.

## Security Considerations

The hardcoded data directory subpath (per ADR-003) keeps the blast radius narrow: reporters write a single fixed file (`.claude/tdd-guard/data/test.json`), so even if an attacker steers the configured project root, the only thing they can affect is that single file under the chosen directory — they cannot choose a different filename or write to multiple paths. Broader containment of untrusted code execution is handled at the harness, container, and OS layers, where the appropriate primitives now exist.
