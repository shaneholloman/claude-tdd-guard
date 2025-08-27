import {
  LintResult,
  LintIssue,
  GolangciLintIssue,
  GolangciLintResult,
} from '../../contracts/schemas/lintSchemas'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { dirname, resolve, basename, isAbsolute } from 'path'
import { Linter } from '../Linter'

const execFileAsync = promisify(execFile)

export class GolangciLint implements Linter {
  async lint(filePaths: string[], configPath?: string): Promise<LintResult> {
    const timestamp = new Date().toISOString()
    const args = buildArgs(filePaths, configPath)

    try {
      // Extract unique directories from file paths to determine working directory
      const directories = [...new Set(filePaths.map((file) => dirname(file)))]
      const workingDir = directories.length > 0 ? directories[0] : process.cwd()

      await execFileAsync('golangci-lint', args, { cwd: workingDir })
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
export const buildArgs = (_files: string[], configPath?: string): string[] => {
  const args = ['run', '--output.json.path=stdout']

  if (configPath !== undefined) {
    args.push('--config', configPath)
  } else {
    args.push('--no-config')
  }

  // When using directory-based linting with cwd, use current directory
  args.push('.')

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
  const issues = extractIssues(results, files)

  return {
    timestamp,
    files,
    issues,
    errorCount: countBySeverity(issues, 'error'),
    warningCount: countBySeverity(issues, 'warning'),
  }
}

const extractIssues = (
  results: GolangciLintIssue[],
  requestedFiles: string[]
): LintIssue[] => results.flatMap((issue) => parseIssue(issue, requestedFiles))

const parseIssue = (
  issue: GolangciLintIssue,
  requestedFiles: string[]
): LintIssue[] => {
  // Check if this is a multi-line issue (directory-based output)
  if (issue.Text.includes('\n') && issue.Text.includes('.go:')) {
    // Parse multi-line text to extract individual issues
    const lines = issue.Text.split('\n').slice(1) // Skip module name line
    return lines
      .filter((line) => line.includes('.go:'))
      .map((line) => parseIssueLine(line, issue.FromLinter, requestedFiles))
      .filter((parsedIssue): parsedIssue is LintIssue => parsedIssue !== null)
  }

  // Single issue - use original logic with path resolution
  const resolvedPath = resolveFilePath(issue.Pos.Filename, requestedFiles)
  return [
    {
      file: resolvedPath,
      line: issue.Pos.Line,
      column: issue.Pos.Column,
      severity: 'error' as const,
      message: issue.Text,
      rule: issue.FromLinter,
    },
  ]
}

const parseIssueLine = (
  line: string,
  linter: string,
  requestedFiles: string[]
): LintIssue | null => {
  // Parse format: "./file-with-issues.go:8:2: declared and not used: message"
  // Split by : to avoid regex backtracking issues
  const colonIndex = line.indexOf(':')
  if (colonIndex === -1 || !line.includes('.go:')) return null

  const parts = line.split(':')
  const MIN_PARTS = 4 // filename:line:column:message
  const MESSAGE_START_INDEX = 3

  if (parts.length < MIN_PARTS) return null

  const filename = parts[0]
  const lineStr = parts[1]
  const columnStr = parts[2]
  const message = parts.slice(MESSAGE_START_INDEX).join(':').trim()

  if (
    !filename.endsWith('.go') ||
    !/^\d+$/.test(lineStr) ||
    !/^\d+$/.test(columnStr)
  ) {
    return null
  }

  const resolvedPath = resolveFilePath(filename, requestedFiles)

  return {
    file: resolvedPath,
    line: parseInt(lineStr, 10),
    column: parseInt(columnStr, 10),
    severity: 'error' as const,
    message,
    rule: linter,
  }
}

const resolveFilePath = (
  filename: string,
  requestedFiles: string[]
): string => {
  // If already absolute, return as-is
  if (isAbsolute(filename)) {
    return filename
  }

  // Remove leading './' if present
  const cleanFilename = filename.startsWith('./') ? filename.slice(2) : filename

  // Try to match to one of the requested files by basename
  const matchingFile = requestedFiles.find((file) => {
    const fileBasename = basename(file)
    const targetBasename = basename(cleanFilename)
    return fileBasename === targetBasename
  })

  if (matchingFile) {
    return matchingFile
  }

  // Fallback: resolve relative to first file's directory
  if (requestedFiles.length > 0) {
    const firstFileDir = dirname(requestedFiles[0])
    return resolve(firstFileDir, cleanFilename)
  }

  // Last resort: return as-is
  return filename
}

const countBySeverity = (
  issues: LintIssue[],
  severity: 'error' | 'warning'
): number => issues.filter((i) => i.severity === severity).length
