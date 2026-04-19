import { COUNT_NEW_TESTS, MATCH_FAILURE_TYPE } from '../shared'

export const EDIT = `## Analyzing Edit Operations

This section shows the code changes being proposed. Compare the old content with the new content to identify what's being added, removed, or modified.

### Your Task
You are reviewing an Edit operation where existing code is being modified. You must determine if this edit violates TDD principles.

**IMPORTANT**: First identify if this is a test file or implementation file by checking the file path for \`.test.\`, \`.spec.\`, or \`test/\`.

${COUNT_NEW_TESTS}
**Example**: If old content has 1 test and new content has 2 tests, that's adding 1 new test (allowed), NOT 2 tests total.

### Analyzing Test File Changes

**For test files**: Adding ONE new test is ALWAYS allowed - no test output required. This is the foundation of TDD.

### Analyzing Implementation File Changes

**For implementation files**:

${MATCH_FAILURE_TYPE}
### Example Analysis

**Scenario**: Test can't locate \`Calculator\` (import/symbol unresolved)
- Allowed: Add empty stub — \`export class Calculator {}\`
- Violation: Add methods — \`export class Calculator { add(a, b) { return a + b; } }\`
- **Reason**: Should only stub to resolve the symbol, not implement methods

`
