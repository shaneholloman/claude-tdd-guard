import { describe, test, expect, beforeEach } from 'vitest'
import { RuboCop } from './RuboCop'
import { join } from 'path'
import { LintResult } from '../../contracts/schemas/lintSchemas'
import { hasRules, issuesFromFile } from '../../../test/utils/assertions'

describe('RuboCop', () => {
  let linter: RuboCop

  beforeEach(() => {
    linter = new RuboCop()
  })

  test('can be instantiated', () => {
    expect(linter).toBeDefined()
  })

  test('implements Linter interface with lint method', async () => {
    const result = await linter.lint([])

    expect(result).toBeDefined()
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  test('returns the file paths that were passed in', async () => {
    const filePaths = ['src/file1.rb', 'src/file2.rb']
    const result = await linter.lint(filePaths)

    expect(result.files).toEqual(filePaths)
  })

  describe('with single file', () => {
    let result: LintResult

    beforeEach(async () => {
      result = await linter.lint(['src/file.rb'])
    })

    test('returns empty issues array', () => {
      expect(result.issues).toEqual([])
    })

    test('returns zero error count', () => {
      expect(result.errorCount).toBe(0)
    })

    test('returns zero warning count', () => {
      expect(result.warningCount).toBe(0)
    })
  })

  describe('with files containing special characters', () => {
    test.each([
      ['spaces', 'src/my file with spaces.rb'],
      ['quotes', 'src/file"with"quotes.rb'],
      ['semicolons', 'src/file;name.rb'],
      ['backticks', 'src/file`with`backticks.rb'],
      ['dollar signs', 'src/file$with$dollar.rb'],
      ['pipes', 'src/file|with|pipes.rb'],
      ['ampersands', 'src/file&with&ampersands.rb'],
      ['parentheses', 'src/file(with)parentheses.rb'],
      ['command injection attempt', 'file.rb"; cat /etc/passwd; echo "'],
      ['newlines', 'src/file\nwith\nnewlines.rb'],
      ['tabs', 'src/file\twith\ttabs.rb'],
    ])('handles file paths with %s correctly', async (_, filePath) => {
      const result = await linter.lint([filePath])

      expect(result.files).toEqual([filePath])
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    test.each([
      ['spaces', '/path with spaces/.rubocop.yml'],
      ['quotes', '/path"with"quotes/.rubocop.yml'],
      ['special chars', '/path;with&special|chars/.rubocop.yml'],
    ])('handles config paths with %s correctly', async (_, configPath) => {
      const result = await linter.lint(['src/file.rb'], configPath)

      expect(result.files).toEqual(['src/file.rb'])
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('linter.lint with artifact files', () => {
    const artifactsDir = join(process.cwd(), 'test', 'artifacts', 'ruby')
    const configPath = join(artifactsDir, '.rubocop.yml')

    test('detects issues in file with lint problems', async () => {
      const filePath = join(artifactsDir, 'file-with-issues.rb')
      const result = await linter.lint([filePath], configPath)

      expect(result.issues.length).toBeGreaterThan(0)

      // Check for specific cops
      const expectedRules = [
        'Lint/UselessAssignment',
        'Style/StringLiterals',
        'Metrics/ParameterLists',
      ]
      const ruleResults = hasRules(result.issues, expectedRules)

      ruleResults.forEach((ruleExists) => {
        expect(ruleExists).toBe(true)
      })
    })

    test('finds no issues in clean file', async () => {
      const filePath = join(artifactsDir, 'file-without-issues.rb')
      const result = await linter.lint([filePath], configPath)

      expect(result.issues.length).toBe(0)
      expect(result.errorCount).toBe(0)
      expect(result.warningCount).toBe(0)
    })

    test('processes multiple files correctly', async () => {
      const files = [
        join(artifactsDir, 'file-with-issues.rb'),
        join(artifactsDir, 'file-without-issues.rb'),
      ]
      const result = await linter.lint(files, configPath)

      expect(result.files).toEqual(files)
      expect(result.issues.length).toBeGreaterThan(0)

      // Issues should only be from the file with issues
      const cleanFileIssues = issuesFromFile(
        result.issues,
        'file-without-issues.rb'
      )
      expect(cleanFileIssues.length).toBe(0)
    })
  })
})
