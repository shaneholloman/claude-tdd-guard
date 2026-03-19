import { spawnSync } from 'node:child_process'
import { existsSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import type { ReporterConfig, TestScenarios } from '../types'
import { copyTestArtifacts } from './helpers'

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

      // Symlink vendor/bundle from rspec reporter for gem dependencies
      const reporterVendorPath = join(__dirname, '../../rspec/vendor')
      const tempVendorPath = join(tempDir, 'vendor')
      symlinkSync(reporterVendorPath, tempVendorPath)

      // Run rspec with the TDD Guard formatter
      const rubyBinary = resolveRubyBinary()
      const rspecPath = join(
        __dirname,
        '../../rspec/vendor/bundle/ruby',
        getRubyVersion(rubyBinary),
        'bin/rspec'
      )
      const formatterLibPath = join(__dirname, '../../rspec/lib')
      const testFile = testScenarios[scenario]

      spawnSync(
        rubyBinary,
        [
          '-I',
          formatterLibPath,
          rspecPath,
          testFile,
          '--format',
          'TddGuardRspec::Formatter',
        ],
        {
          cwd: tempDir,
          env: {
            ...process.env,
            TDD_GUARD_PROJECT_ROOT: tempDir,
            GEM_PATH: join(
              __dirname,
              '../../rspec/vendor/bundle/ruby',
              getRubyVersion(rubyBinary)
            ),
          },
          stdio: 'pipe',
          encoding: 'utf8',
        }
      )
    },
  }
}

function resolveRubyBinary(): string {
  const knownPaths = [
    '/usr/local/bin/ruby',
    '/usr/bin/ruby',
    '/opt/homebrew/bin/ruby',
  ]
  return knownPaths.find(existsSync) ?? 'ruby'
}

function getRubyVersion(rubyBinary: string): string {
  const result = spawnSync(
    rubyBinary,
    ['-e', 'puts RbConfig::CONFIG["ruby_version"]'],
    {
      stdio: 'pipe',
      encoding: 'utf8',
    }
  )
  return result.stdout.trim() || '2.6.0'
}
