export const COUNT_NEW_TESTS = `### How to Count New Tests
**CRITICAL**: A test is only "new" if it doesn't exist in the old content.

1. **Compare old content vs new content:**
   - Find test declarations: \`test(\`, \`it(\`, \`describe(\`
   - A test that exists in both old and new is NOT new
   - Only count tests that appear in new but not in old

2. **What counts as a new test:**
   - A test block that wasn't in the old content
   - NOT: Moving an existing test to a different location
   - NOT: Renaming an existing test
   - NOT: Reformatting or refactoring existing tests

3. **Multiple test check:**
   - One new test = Allowed (part of TDD cycle)
   - Two or more new tests = Violation
`

export const MATCH_FAILURE_TYPE = `1. **Check the test output** to understand the current failure
2. **Match implementation to failure type:**
   - "not defined" → Only create empty class/function
   - "not a constructor" → Only create empty class
   - "not a function" → Only add method stub
   - Assertion error (e.g., "expected 0 to be 4") → Implement minimal logic to make it pass

3. **Verify minimal implementation:**
   - Don't add extra methods
   - Don't add error handling unless tested
   - Don't implement features beyond current test
`
