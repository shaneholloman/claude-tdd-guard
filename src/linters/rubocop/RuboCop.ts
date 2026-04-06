import {
  LintResult,
  LintIssue,
  RuboCopResult,
  RuboCopFile,
  RuboCopOffense,
} from '../../contracts/schemas/lintSchemas'
import { Linter } from '../Linter'
import { runRuboCop, RunRuboCop } from './runRuboCop'

export class RuboCop implements Linter {
  private readonly run: RunRuboCop

  constructor(run: RunRuboCop = runRuboCop) {
    this.run = run
  }

  async lint(filePaths: string[], configPath?: string): Promise<LintResult> {
    const timestamp = new Date().toISOString()
    const args = buildArgs(filePaths, configPath)

    try {
      const { stdout } = await this.run(args, {
        shell: process.platform === 'win32',
      })
      return createLintData(timestamp, filePaths, parseResults(String(stdout)))
    } catch (error) {
      if (!isExecError(error)) throw error

      return createLintData(
        timestamp,
        filePaths,
        parseResults(String(error.stdout))
      )
    }
  }
}

// Helper functions
const buildArgs = (files: string[], configPath?: string): string[] => {
  const args = [...files, '--format', 'json']
  if (configPath) {
    args.push('--config', configPath)
  }
  return args
}

const isExecError = (error: unknown): error is Error & { stdout?: string } =>
  error !== null && typeof error === 'object' && 'stdout' in error

const parseResults = (stdout?: string): RuboCopFile[] => {
  try {
    const parsed: RuboCopResult = JSON.parse(stdout ?? '{"files":[]}')
    return parsed.files ?? []
  } catch {
    return []
  }
}

const createLintData = (
  timestamp: string,
  files: string[],
  results: RuboCopFile[]
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

const extractIssues = (results: RuboCopFile[]): LintIssue[] =>
  results.flatMap((file) => file.offenses.map(toIssue(file.path)))

const toIssue =
  (filePath: string) =>
  (offense: RuboCopOffense): LintIssue => ({
    file: filePath,
    line: offense.location.line,
    column: offense.location.column,
    severity: mapSeverity(offense.severity),
    message: offense.message,
    rule: offense.cop_name,
  })

const mapSeverity = (severity: string): 'error' | 'warning' =>
  severity === 'error' || severity === 'fatal' ? 'error' : 'warning'

const countBySeverity = (
  issues: LintIssue[],
  severity: 'error' | 'warning'
): number => issues.filter((i) => i.severity === severity).length
