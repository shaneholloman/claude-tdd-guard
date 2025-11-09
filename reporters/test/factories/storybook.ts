import type { ReporterConfig, TestScenarios } from '../types'
import { StorybookReporter } from '../../storybook/src/StorybookReporter'

// TODO: Replace mock-based approach with actual Storybook test-runner integration
// This is a simplified mock-based implementation to validate the reporter
// without requiring full Storybook setup. Future work should include:
// - Real Storybook configuration
// - Actual story files with play functions
// - Full @storybook/test-runner setup

export function createStorybookReporter(): ReporterConfig {
  const testScenarios = {
    singlePassing: 'Button.stories.tsx',
    singleFailing: 'Button.stories.tsx',
    singleImportError: 'Button.stories.tsx',
  }

  return {
    name: 'StorybookReporter',
    testScenarios,
    run: (tempDir, scenario: keyof TestScenarios) => {
      const reporter = new StorybookReporter(tempDir)

      // Simulate Storybook test-runner behavior with mocked contexts
      switch (scenario) {
        case 'singlePassing':
          simulatePassingStory(reporter)
          break
        case 'singleFailing':
          simulateFailingStory(reporter)
          break
        case 'singleImportError':
          simulateImportError(reporter)
          break
      }

      // Complete the test run
      reporter.onComplete()
    },
  }
}

async function simulatePassingStory(reporter: StorybookReporter) {
  await reporter.onStoryResult({
    id: 'button--primary',
    title: 'Calculator',
    storyExport: {
      name: 'should add numbers correctly',
    },
    status: 'passed',
    errors: [],
  })
}

async function simulateFailingStory(reporter: StorybookReporter) {
  await reporter.onStoryResult({
    id: 'button--primary',
    title: 'Calculator',
    storyExport: {
      name: 'should add numbers correctly',
    },
    status: 'failed',
    errors: [
      {
        message: 'Expected: 6\nReceived: 5',
        stack: 'Error: Expected: 6\n    at Button.stories.tsx:10:5',
      },
    ],
  })
}

async function simulateImportError(reporter: StorybookReporter) {
  await reporter.onStoryResult({
    id: 'button--primary',
    title: 'Calculator',
    storyExport: {
      name: 'should add numbers correctly',
    },
    status: 'failed',
    errors: [
      {
        message: "Cannot find module './non-existent-module'",
        stack:
          "Error: Cannot find module './non-existent-module' imported from Button.stories.tsx",
      },
    ],
  })
}
