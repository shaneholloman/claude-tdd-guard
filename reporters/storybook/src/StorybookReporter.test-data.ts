import type { TestContext } from './types'

const DEFAULT_STORY_ID = 'button--primary'
const DEFAULT_STORY_TITLE = 'Button'
const DEFAULT_STORY_NAME = 'Primary'

export function createStoryContext(
  overrides?: Partial<TestContext>
): TestContext {
  return {
    id: DEFAULT_STORY_ID,
    title: DEFAULT_STORY_TITLE,
    storyExport: {
      name: DEFAULT_STORY_NAME,
    },
    status: 'passed',
    errors: [],
    ...overrides,
  }
}

export function passedStoryContext(
  overrides?: Partial<TestContext>
): TestContext {
  return createStoryContext({
    status: 'passed',
    errors: [],
    ...overrides,
  })
}

export function failedStoryContext(
  overrides?: Partial<TestContext>
): TestContext {
  return createStoryContext({
    status: 'failed',
    errors: [
      {
        message: 'expected button to have aria-label',
        stack: 'Error: expected button to have aria-label\n    at test.ts:7:19',
      },
    ],
    ...overrides,
  })
}

export function skippedStoryContext(
  overrides?: Partial<TestContext>
): TestContext {
  return createStoryContext({
    status: 'skipped',
    ...overrides,
  })
}

export function renderErrorContext(
  overrides?: Partial<TestContext>
): TestContext {
  return createStoryContext({
    status: 'failed',
    errors: [
      {
        message: 'Component crashed: Cannot read property onClick of undefined',
        stack:
          'Error: Component crashed\n    at Button.tsx:12:5\n    at renderWithHooks',
      },
    ],
    ...overrides,
  })
}
