# Storybook Reporter Design

## Overview

Design for `tdd-guard-storybook` package that captures test results from Storybook's `@storybook/test-runner` and writes them to the standard TDD Guard format.

## Problem Statement

Storybook interaction tests (stories with `play` functions) provide valuable test coverage, but TDD Guard currently doesn't recognize these test failures as valid RED-phase evidence. This integration enables TDD workflows using Storybook for component testing.

## Design Decisions

### Test Granularity
**Decision**: Only report stories with `play` functions as tests.

**Rationale**: TDD Guard requires actual test failures as evidence. Stories without `play` functions are just renders and don't provide meaningful RED/GREEN signals. This aligns with how other reporters work (they don't report non-test files).

### Module/Test Hierarchy
**Decision**: One module per story file, multiple stories become tests within that module.

**Structure**:
```json
{
  "testModules": [{
    "moduleId": "src/Button.stories.tsx",
    "tests": [
      { "name": "Primary", "fullName": "Button > Primary", "state": "passed" },
      { "name": "Secondary", "fullName": "Button > Secondary", "state": "failed" }
    ]
  }]
}
```

**Rationale**: Matches how Vitest/Jest group tests by file. One source file = one module is intuitive and simpler to implement.

### Reporter Lifecycle
**Decision**: Accumulate results during `postVisit`, write once on `onExit`.

**API**:
```typescript
async postVisit(page, context) {
  await reporter.onStoryResult(context)
}
async onExit() {
  await reporter.onComplete()
}
```

**Rationale**:
- Matches Vitest/Jest pattern (accumulate, then write once)
- More efficient (one write vs N writes)
- Cleaner separation of concerns
- Better handles interruptions

### Render Failure Handling
**Decision**: Create synthetic failed test for stories that fail to render.

**Rationale**: A story with a `play` function that crashes during render is still a failing test. Matches VitestReporter pattern for module load failures. Provides visibility into all failures, not just interaction test failures.

### Data Extraction Strategy
**Decision**: Extract minimal data from test-runner context directly, no additional page queries.

**Rationale**: Start simple with what test-runner provides out of the box. Less complexity = fewer failure points. Can enhance later if needed.

### Interruption Handling
**Decision**: Best-effort save on exit with "interrupted" status.

**Approach**:
- Register process exit handler to catch interruptions
- Write accumulated results when possible
- Mark overall status as "interrupted"
- Partial results better than no results

**Rationale**: Matches Vitest/Jest pattern. TDD Guard already handles "interrupted" status. Provides partial results which is better than nothing.

## Architecture

### Package Structure
```
reporters/storybook/
├── src/
│   ├── StorybookReporter.ts      # Main reporter implementation
│   ├── types.ts                   # TypeScript types
│   ├── index.ts                   # Public API
│   ├── StorybookReporter.test.ts # Unit tests
│   └── StorybookReporter.test-data.ts # Test fixtures
├── package.json
├── tsconfig.json
└── README.md
```

### Core Reporter Class
```typescript
export class StorybookReporter {
  private readonly storage: Storage
  private readonly collectedTests: Map<string, StoryTest[]>

  constructor(storageOrRoot?: Storage | string)
  async onStoryResult(context: TestContext): Promise<void>
  async onComplete(): Promise<void>
}
```

**Constructor**: Accepts either a `Storage` instance (for testing) or a project root path string (for production), matching the Vitest/Jest pattern.

**State Management**: Maintains internal map grouping tests by story file path.

**Lifecycle**: Accumulates results in memory, writes once to `.claude/tdd-guard/data/test.json` on completion.

## Data Flow

### Test Collection Flow
1. Test-runner calls `postVisit(page, context)` after each story with `play` function
2. Reporter extracts: story ID, title, pass/fail state, error details (if any)
3. Groups tests by story file path in `collectedTests` map
4. On `onComplete()`, transforms collected data into standard format and writes to storage

### Output Format
Standard format matching Vitest/Jest reporters:

```typescript
{
  testModules: [
    {
      moduleId: "/absolute/path/to/Button.stories.tsx",
      tests: [
        {
          name: "Primary",
          fullName: "Button > Primary",
          state: "passed" | "failed" | "skipped",
          errors?: [{ message: string, stack?: string }]
        }
      ]
    }
  ],
  unhandledErrors: [],
  reason?: "passed" | "failed" | "interrupted"
}
```

### Module Grouping
- All stories from same `.stories.tsx` file become tests under one module
- `moduleId` is the absolute file path
- `fullName` combines component name and story name (e.g., "Button > Primary")

### Error Extraction
- Story test fails: Extract error message and stack from Playwright test context
- Story crashes during render: Create synthetic failed test with render error

## Error Handling & Edge Cases

### Render Failures
When a story with `play` function crashes during render:
```typescript
{
  name: storyName,
  fullName: `${componentName} > ${storyName}`,
  state: "failed",
  errors: [{ message: renderError.message, stack: renderError.stack }]
}
```

### Interrupted Test Runs
- Register process exit handler to catch Ctrl+C or crashes
- Call `onComplete()` with accumulated results
- Set `reason: "interrupted"`
- Partial results saved

### Empty Test Runs
- Output: `{ testModules: [], unhandledErrors: [], reason: "passed" }`
- TDD Guard sees "no tests to validate against"

### Overall Status Determination
- All tests pass → `reason: "passed"`
- Any test fails → `reason: "failed"`
- Run interrupted → `reason: "interrupted"`

## Testing Strategy

### Unit Tests
Following VitestReporter pattern:

```typescript
describe('StorybookReporter', () => {
  // Use MemoryStorage for fast unit tests
  // Use FileStorage for integration scenarios

  describe('when collecting story results', () => {
    it('saves output as valid JSON')
    it('includes test modules')
    it('includes test cases')
    it('captures test states (passed/failed/skipped)')
    it('includes error information for failed tests')
  })

  describe('test state mapping', () => {
    it.each(['passed', 'failed', 'skipped'])('maps %s correctly')
  })

  describe('error handling', () => {
    it('handles render failures with synthetic failed test')
    it('handles empty test runs')
    it('handles interrupted test runs')
  })

  describe('overall test run status', () => {
    it('reports "passed" when all tests pass')
    it('reports "failed" when any test fails')
    it('reports "interrupted" when run is cancelled')
  })
})
```

### Test Data Factories
Create `StorybookReporter.test-data.ts`:
- `createStoryContext()` - Mock Playwright test context
- `passedStoryContext()` - Story test that passed
- `failedStoryContext()` - Story test that failed
- `renderErrorContext()` - Story that crashed during render

### Integration Tests
Add to `reporters/test/reporters.integration.test.ts` following existing pattern.

## Public API

### Installation
```bash
npm install --save-dev tdd-guard-storybook
```

### Basic Configuration
`.storybook/test-runner.ts`:
```typescript
import { StorybookReporter } from 'tdd-guard-storybook'

const reporter = new StorybookReporter()

module.exports = {
  async postVisit(page, context) {
    await reporter.onStoryResult(context)
  }
}

process.on('exit', () => {
  reporter.onComplete()
})
```

### Workspace/Monorepo Configuration
```typescript
import path from 'path'

const reporter = new StorybookReporter(path.resolve(__dirname, '../..'))
```

### API Surface
- `constructor(storageOrRoot?: Storage | string)` - Initialize reporter
- `async onStoryResult(context: TestContext): Promise<void>` - Collect story result
- `async onComplete(): Promise<void>` - Write results to storage

## Implementation Notes

### Dependencies
- `tdd-guard` - Core package for Storage and Config
- `@storybook/test-runner` - Peer dependency for types
- Standard TypeScript tooling

### File Locations
- Results saved to: `.claude/tdd-guard/data/test.json`
- Uses Storage abstraction from tdd-guard core

### Security Considerations
Following CONTRIBUTING.md requirements:
- Validate that project root path is absolute
- Verify project root is current working directory or ancestor
- Add relevant test cases to integration tests

## Success Criteria

- [ ] Storybook test failures captured and written to test.json
- [ ] Format matches tdd-guard-vitest output (compatible with validation logic)
- [ ] Clean API that's easy to configure
- [ ] Handles edge cases (no tests, all passing, mixed results)
- [ ] Works with standard Storybook + test-runner setup
- [ ] All tests pass
- [ ] Linting and formatting pass
- [ ] Integration tests added following reporter pattern
- [ ] README with clear usage instructions

## References

- Issue: https://github.com/nizos/tdd-guard/issues/81
- Pattern reference: reporters/vitest/src/VitestReporter.ts
- Output format: reporters/vitest/src/types.ts
- Integration tests: reporters/test/reporters.integration.test.ts
