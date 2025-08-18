import {
  LintResult,
  LintIssue,
  GolangciLintIssue,
  GolangciLintResult,
} from '../../contracts/schemas/lintSchemas'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { Linter } from '../Linter'

const execFileAsync = promisify(execFile)

export class GolangciLint implements Linter {
  async lint(filePaths: string[], configPath?: string): Promise<LintResult> {
    const timestamp = new Date().toISOString()
    const args = buildArgs(filePaths, configPath)

    try {
      await execFileAsync('golangci-lint', args)
      return createLintData(timestamp, filePaths, [])
    } catch (error) {
      if (!isExecError(error)) {
        return createLintData(timestamp, filePaths, [])
      }

      const results = parseResults(error.stdout)
      return createLintData(timestamp, filePaths, results)
    }
  }
}

// Helper functions
const buildArgs = (files: string[], configPath?: string): string[] => {
  const args = ['run', '--output.json.path=stdout']

  if (configPath !== undefined) {
    args.push('--config', configPath)
  } else {
    args.push('--no-config')
  }
  args.push(...files)

  return args
}

const isExecError = (error: unknown): error is Error & { stdout?: string } =>
  error !== null && typeof error === 'object' && 'stdout' in error

// Parse golangci-lint JSON output - only first line contains JSON, rest is summary
const parseResults = (stdout?: string): GolangciLintIssue[] => {
  try {
    if (stdout === undefined || stdout === '') {
      return []
    }

    const lines = stdout.split('\n')
    const jsonLine = lines[0]
    if (jsonLine.trim() === '') {
      return []
    }

    const parsed: GolangciLintResult = JSON.parse(jsonLine)
    return parsed.Issues ?? []
  } catch {
    return []
  }
}

const createLintData = (
  timestamp: string,
  files: string[],
  results: GolangciLintIssue[]
): LintResult => {
  const issues = extractIssues(results)

  return {
    timestamp,
    files,
    issues,
    errorCount: countBySeverity(issues, 'error'),
    warningCount: countBySeverity(issues, 'warning'),
  }
}

const extractIssues = (results: GolangciLintIssue[]): LintIssue[] =>
  results.map(toIssue)

const toIssue = (issue: GolangciLintIssue): LintIssue => ({
  file: issue.Pos.Filename,
  line: issue.Pos.Line,
  column: issue.Pos.Column,
  severity: 'error' as const, // golangci-lint doesn't provide severity levels
  message: issue.Text,
  rule: issue.FromLinter,
})

const countBySeverity = (
  issues: LintIssue[],
  severity: 'error' | 'warning'
): number => issues.filter((i) => i.severity === severity).length
