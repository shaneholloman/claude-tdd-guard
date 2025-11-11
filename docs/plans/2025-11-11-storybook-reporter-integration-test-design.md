# Storybook Reporter Integration Test Design

## Overview

Replace the mock-based Storybook reporter integration test with a real implementation that executes actual Storybook test-runner commands, following the same pattern as Jest, Vitest, PHPUnit, Pytest, Go, and Rust reporters.

## Goals

1. Execute real `@storybook/test-runner` commands with actual story files
2. Validate reporter integration with genuine Storybook test output
3. Follow existing integration test patterns in the codebase
4. Use JavaScript stories (`.stories.js`) to match repo conventions (`.test.js`)

## Architecture

### Test Artifacts Structure

```
reporters/test/storybook/
├── Calculator.js                      # Simple component module
├── single-passing.stories.js          # Story with passing assertions
├── single-failing.stories.js          # Story with failing expect()
└── single-import-error.stories.js     # Story importing non-existent module
```

### Factory Implementation

Update `reporters/test/factories/storybook.ts` to:

1. **Copy test artifacts** - Use existing `copyTestArtifacts` helper
2. **Generate Storybook config** - Write `.storybook/main.js`
3. **Generate test-runner config** - Write `test-runner-jest.config.js` with reporter
4. **Execute test-runner** - Spawn `test-storybook` command via `spawnSync`
5. **Capture results** - Reporter saves to FileStorage, factory reads back

### Test Flow

```
Integration Test
    ↓
Factory (storybook.ts)
    ↓
Copy story files → Write configs → Spawn test-runner
    ↓
@storybook/test-runner (Jest + Playwright)
    ↓
Executes stories → Calls StorybookReporter hooks
    ↓
StorybookReporter.onStoryResult() → Save to FileStorage
    ↓
Factory reads results → Returns to test assertions
```

## Test Scenarios

### Scenario 1: Single Passing Test

**File:** `single-passing.stories.js`

```js
import { expect } from '@storybook/test'
import { Calculator } from './Calculator'

export default {
  title: 'Calculator',
}

export const Primary = {
  name: 'should add numbers correctly',
  play: async () => {
    const result = Calculator.add(2, 3)
    await expect(result).toBe(5)
  },
}
```

**Expected Output:**

- `moduleId`: Contains `'single-passing'` or story ID
- `testName`: `'should add numbers correctly'`
- `fullName`: `'Calculator > should add numbers correctly'`
- `state`: `'passed'`
- `reason`: `'passed'`

### Scenario 2: Single Failing Test

**File:** `single-failing.stories.js`

```js
import { expect } from '@storybook/test'
import { Calculator } from './Calculator'

export default {
  title: 'Calculator',
}

export const Primary = {
  name: 'should add numbers correctly',
  play: async () => {
    const result = Calculator.add(2, 3)
    await expect(result).toBe(6) // Intentionally wrong
  },
}
```

**Expected Output:**

- `state`: `'failed'`
- `errors[0].message`: Contains `'Expected: 6'` and `'Received: 5'`
- `errors[0].expected`: `'6'`
- `errors[0].actual`: `'5'`
- `reason`: `'failed'`

### Scenario 3: Import Error

**File:** `single-import-error.stories.js`

```js
import { expect } from '@storybook/test'
import { NonExistent } from './non-existent-module' // Module doesn't exist

export default {
  title: 'Calculator',
}

export const Primary = {
  name: 'should add numbers correctly',
  play: async () => {
    await expect(true).toBe(true)
  },
}
```

**Expected Output:**

- `state`: `'failed'`
- `errors[0].message`: Contains `"Cannot find module './non-existent-module'"`
- `reason`: `'failed'`

## Configuration Files

### Storybook Configuration

**`.storybook/main.js`:**

```js
module.exports = {
  stories: ['../*.stories.js'],
  framework: '@storybook/react-vite',
  core: {
    disableTelemetry: true,
  },
}
```

### Test Runner Configuration

**`test-runner-jest.config.js`:**

```js
const path = require('path')

module.exports = {
  testEnvironmentOptions: {
    'jest-playwright': {
      browsers: ['chromium'],
      launchOptions: {
        headless: true,
      },
    },
  },
  reporters: [
    'default',
    [
      '<reporter-path>/dist/index.js',
      {
        projectRoot: '<temp-dir>',
      },
    ],
  ],
}
```

## Dependencies

**New dependencies for `reporters/storybook/package.json`:**

```json
{
  "devDependencies": {
    "@storybook/test-runner": "^0.19.0",
    "@storybook/react-vite": "^8.0.0",
    "@storybook/test": "^8.0.0",
    "storybook": "^8.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

## Implementation Steps

1. **Create test artifacts**
   - Add `reporters/test/storybook/` directory
   - Create Calculator.js component
   - Create three story files (passing, failing, import-error)

2. **Update factory**
   - Replace mock implementation in `storybook.ts`
   - Add config generation functions
   - Add test-runner spawning logic
   - Follow Jest/Vitest factory patterns

3. **Update integration test**
   - Add Storybook to test matrices for failing and import error scenarios
   - Update expected values to match actual test-runner output

4. **Install dependencies**
   - Add Storybook dependencies to reporter package
   - Run `npm install` in reporters/storybook/

5. **Test and validate**
   - Run `npm run test:reporters`
   - Verify all three scenarios pass
   - Confirm output matches expected format

## Success Criteria

- [ ] All three Storybook test scenarios pass in `reporters.integration.test.ts`
- [ ] Test execution uses real `@storybook/test-runner` (not mocks)
- [ ] Reporter correctly captures story results from test-runner hooks
- [ ] Output format matches other reporters (moduleId, testName, fullName, state, errors, reason)
- [ ] Tests run in CI without requiring manual Storybook setup
- [ ] Pattern follows existing Jest/Vitest integration test approach

## Trade-offs

**Chosen Approach:**

- Real Storybook test-runner execution
- JavaScript stories (`.stories.js`)

**Alternatives Considered:**

- Mock-based tests: Rejected because goal is real integration validation
- TypeScript stories (`.tsx`): Rejected to match repo's `.test.js` convention and reduce complexity
- Vitest addon: Rejected because test-runner is more established and framework-agnostic

## Future Enhancements

- Add visual regression testing scenario
- Test custom test-runner hooks (preVisit, postVisit)
- Add accessibility testing scenario
- Test with MSW for network request mocking
