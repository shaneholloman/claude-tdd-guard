# ADR-008: Storybook Reporter Design

## Status

Accepted

## Context

Storybook interaction tests (stories with `play` functions) provide valuable component test coverage, but TDD Guard didn't recognize these test failures as valid RED-phase evidence. This prevented developers from using TDD workflows with Storybook for component testing.

We needed to design a reporter that:

- Captures test results from Storybook's `@storybook/test-runner`
- Writes results in TDD Guard's standard format
- Handles the unique characteristics of Storybook's test model
- Follows the established patterns from other reporters (Vitest, Jest)

We considered several design decisions:

1. **Test granularity** - Should we report all stories or only those with tests?
2. **Module hierarchy** - How should we group stories into modules?
3. **Reporter lifecycle** - Should we write on each story or accumulate results?
4. **Render failures** - How should we handle stories that crash during render?
5. **Data extraction** - Should we query the page or use provided context?

## Decision

We will implement `tdd-guard-storybook` with the following design:

### Test Granularity

**Only report stories with `play` functions as tests.**

Stories without `play` functions are just renders and don't provide meaningful RED/GREEN signals. This aligns with how other reporters work - they don't report non-test files. TDD Guard requires actual test failures as evidence.

### Module/Test Hierarchy

**One module per story file, multiple stories become tests within that module.**

Structure:

```json
{
  "testModules": [
    {
      "moduleId": "src/Button.stories.tsx",
      "tests": [
        {
          "name": "Primary",
          "fullName": "Button > Primary",
          "state": "passed"
        }
      ]
    }
  ]
}
```

This matches how Vitest/Jest group tests by file. One source file = one module is intuitive and simpler to implement.

### Reporter Lifecycle

**Accumulate results during `postVisit`, write once on `onExit`.**

API:

```typescript
async postVisit(page, context) {
  await reporter.onStoryResult(context)
}
async onExit() {
  await reporter.onComplete()
}
```

This matches the Vitest/Jest pattern, is more efficient (one write vs N writes), provides cleaner separation of concerns, and better handles interruptions.

### Render Failure Handling

**Create synthetic failed test for stories that fail to render.**

A story with a `play` function that crashes during render is still a failing test. This matches VitestReporter pattern for module load failures and provides visibility into all failures, not just interaction test failures.

### Data Extraction Strategy

**Extract minimal data from test-runner context directly, no additional page queries.**

Start simple with what test-runner provides out of the box. Less complexity = fewer failure points. Can enhance later if needed.

### Interruption Handling

**Best-effort save on exit with "interrupted" status.**

Approach:

- Register process exit handler to catch interruptions
- Write accumulated results when possible
- Mark overall status as "interrupted"
- Partial results better than no results

This matches the Vitest/Jest pattern and TDD Guard already handles "interrupted" status.

## Consequences

### Positive

- **Consistent patterns** - Follows established Vitest/Jest reporter patterns
- **Efficient** - Single write operation instead of multiple
- **Complete coverage** - Captures both interaction test failures and render failures
- **Simple API** - Easy to configure with minimal code
- **Robust** - Handles interruptions gracefully
- **TDD-aligned** - Only reports actual tests, not passive renders

### Negative

- **Stories without `play` not tracked** - But these aren't tests, so this is intentional
- **Accumulates in memory** - Could be an issue for extremely large test suites, but matches other reporters
- **Storybook-specific** - Requires `@storybook/test-runner` as peer dependency

### Neutral

- Users need to configure `.storybook/test-runner.ts` with the reporter
- Follows same security validations as other reporters (absolute paths, project root validation)
- Results saved to standard location: `.claude/tdd-guard/data/test.json`
