import { COUNT_NEW_TESTS, MATCH_FAILURE_TYPE } from '../shared'

export const OVERWRITE = `## Analyzing Overwrite Operations

This section shows an existing file being replaced in full. Compare the old content with the new content to identify what is being added, removed, or modified.

### Your Task
You are reviewing a Write operation that overwrites an existing file. Determine if this violates TDD principles.

**IMPORTANT**: First identify if this is a test file or implementation file by checking the file path for \`.test.\`, \`.spec.\`, or \`test/\`.

${COUNT_NEW_TESTS}
### Analyzing Test File Overwrites

Adding ONE **new** test (as counted above) is allowed without a failing test output. This is the foundation of TDD.

### Analyzing Implementation File Overwrites

${MATCH_FAILURE_TYPE}
**Exception**: Refactor during green — types, constants, or helpers that don't introduce new runtime behavior are allowed.

## Changes to Review
`
