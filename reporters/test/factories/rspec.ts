import { spawnSync } from 'node:child_process'
import { existsSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import type { ReporterConfig, TestScenarios } from '../types'
import { copyTestArtifacts } from './helpers'

// Use hardcoded absolute path for security when available, fall back to PATH for CI environments
const bundleBinary =
  ['/usr/local/bin/bundle', '/usr/bin/bundle', '/opt/homebrew/bin/bundle'].find(
    existsSync
  ) ?? 'bundle'

export function createRspecReporter(): ReporterConfig {
  const artifactDir = 'rspec'
  const testScenarios = {
    singlePassing: 'single_passing_spec.rb',
    singleFailing: 'single_failing_spec.rb',
    singleImportError: 'single_import_error_spec.rb',
  }

  return {
    name: 'RSpecReporter',
    testScenarios,
    run: (tempDir, scenario: keyof TestScenarios) => {
      copyTestArtifacts(artifactDir, testScenarios, scenario, tempDir)

      // Symlink vendor/bundle, Gemfile, and gemspec from rspec reporter
      const reporterDir = join(__dirname, '../../rspec')
      symlinkSync(join(reporterDir, 'vendor'), join(tempDir, 'vendor'))
      symlinkSync(join(reporterDir, 'Gemfile'), join(tempDir, 'Gemfile'))
      symlinkSync(
        join(reporterDir, 'Gemfile.lock'),
        join(tempDir, 'Gemfile.lock')
      )
      symlinkSync(
        join(reporterDir, 'tdd_guard_rspec.gemspec'),
        join(tempDir, 'tdd_guard_rspec.gemspec')
      )

      // Run rspec via bundle exec, letting Bundler handle path resolution
      const formatterLibPath = join(reporterDir, 'lib')
      const testFile = testScenarios[scenario]

      spawnSync(
        bundleBinary,
        [
          'exec',
          'rspec',
          testFile,
          '-I',
          formatterLibPath,
          '--format',
          'TddGuardRspec::Formatter',
        ],
        {
          cwd: tempDir,
          env: {
            ...process.env,
            TDD_GUARD_PROJECT_ROOT: tempDir,
            BUNDLE_PATH: 'vendor/bundle',
          },
          stdio: 'pipe',
          encoding: 'utf8',
        }
      )
    },
  }
}
