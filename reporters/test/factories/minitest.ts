import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { ReporterConfig, TestScenarios } from '../types'
import { copyTestArtifacts } from './helpers'

// Use hardcoded absolute path for security when available, fall back to PATH for CI environments
const rubyBinary =
  ['/usr/local/bin/ruby', '/usr/bin/ruby', '/opt/homebrew/bin/ruby'].find(
    existsSync
  ) ?? 'ruby'

export function createMinitestReporter(): ReporterConfig {
  const artifactDir = 'minitest'
  const testScenarios = {
    singlePassing: 'single_passing_test.rb',
    singleFailing: 'single_failing_test.rb',
    singleImportError: 'single_import_error_test.rb',
  }

  return {
    name: 'MinitestReporter',
    testScenarios,
    run: (tempDir, scenario: keyof TestScenarios) => {
      copyTestArtifacts(artifactDir, testScenarios, scenario, tempDir)

      const reporterLibPath = join(__dirname, '../../minitest/lib')
      const testFile = testScenarios[scenario]

      spawnSync(rubyBinary, ['-I', reporterLibPath, testFile], {
        cwd: tempDir,
        env: {
          ...process.env,
          TDD_GUARD_PROJECT_ROOT: tempDir,
        },
        stdio: 'pipe',
        encoding: 'utf8',
      })
    },
  }
}
