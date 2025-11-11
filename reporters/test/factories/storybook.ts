import { spawnSync } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { ReporterConfig, TestScenarios } from '../types'
import { copyTestArtifacts, getReporterPath } from './helpers'

export function createStorybookReporter(): ReporterConfig {
  const artifactDir = 'storybook'
  const testScenarios = {
    singlePassing: 'single-passing.stories.js',
    singleFailing: 'single-failing.stories.js',
    singleImportError: 'single-import-error.stories.js',
  }

  return {
    name: 'StorybookReporter',
    testScenarios,
    run: (tempDir, scenario: keyof TestScenarios) => {
      // Copy Calculator.js (needed by all scenarios)
      copyTestArtifacts(
        artifactDir,
        { common: 'Calculator.js' },
        'common',
        tempDir
      )

      // Copy the specific test scenario story file
      copyTestArtifacts(artifactDir, testScenarios, scenario, tempDir)

      // Create .storybook directory and config
      const storybookDir = join(tempDir, '.storybook')
      mkdirSync(storybookDir, { recursive: true })
      writeFileSync(join(storybookDir, 'main.js'), createStorybookConfig())

      // Write test-runner config
      writeFileSync(
        join(tempDir, 'test-runner-jest.config.js'),
        createTestRunnerConfig(tempDir)
      )

      // Run Storybook test-runner
      const testRunnerPath = require.resolve(
        '@storybook/test-runner/dist/test-storybook'
      )
      const result = spawnSync(
        process.execPath,
        [testRunnerPath, '--config-dir', '.storybook', '--maxWorkers=1'],
        {
          cwd: tempDir,
          env: {
            ...process.env,
            CI: 'true',
            NODE_ENV: 'test',
          },
          stdio: 'pipe',
        }
      )

      // Debug: Log test-runner output if it failed
      if (result.status !== 0) {
        console.error('Storybook test-runner failed:')
        console.error('stdout:', result.stdout?.toString())
        console.error('stderr:', result.stderr?.toString())
        console.error('status:', result.status)
      }
    },
  }
}

function createStorybookConfig(): string {
  return `
module.exports = {
  stories: ['../*.stories.js'],
  framework: '@storybook/react-vite',
  core: {
    disableTelemetry: true,
  },
}
`
}

function createTestRunnerConfig(tempDir: string): string {
  const reporterPath = getReporterPath('storybook/dist/index.js')
  return `
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
    ['${reporterPath}', {
      projectRoot: '${tempDir}'
    }]
  ],
}
`
}
