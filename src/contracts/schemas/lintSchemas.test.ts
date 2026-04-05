import { describe, test, expect } from 'vitest'
import {
  LintIssueSchema,
  LintResultSchema,
  LintDataSchema,
  ESLintMessageSchema,
  ESLintResultSchema,
  GolangciLintPositionSchema,
  GolangciLintIssueSchema,
  GolangciLintResultSchema,
  RuboCopLocationSchema,
  RuboCopOffenseSchema,
  RuboCopFileSchema,
  RuboCopResultSchema,
} from './lintSchemas'
import { testData } from '@testUtils'

describe('LintIssueSchema', () => {
  test.each([
    {
      description: 'valid lint issue with all fields',
      issue: testData.lintIssue(),
      expectedSuccess: true,
    },
    {
      description: 'valid lint issue without optional rule',
      issue: testData.lintIssueWithout(['rule']),
      expectedSuccess: true,
    },
    {
      description: 'without file',
      issue: testData.lintIssueWithout(['file']),
      expectedSuccess: false,
    },
    {
      description: 'without line',
      issue: testData.lintIssueWithout(['line']),
      expectedSuccess: false,
    },
    {
      description: 'without column',
      issue: testData.lintIssueWithout(['column']),
      expectedSuccess: false,
    },
    {
      description: 'without severity',
      issue: testData.lintIssueWithout(['severity']),
      expectedSuccess: false,
    },
    {
      description: 'without message',
      issue: testData.lintIssueWithout(['message']),
      expectedSuccess: false,
    },
    {
      description: 'with invalid severity',
      issue: {
        ...testData.lintIssue(),
        severity: 'info',
      },
      expectedSuccess: false,
    },
  ])('$description', ({ issue, expectedSuccess }) => {
    const result = LintIssueSchema.safeParse(issue)
    expect(result.success).toBe(expectedSuccess)
  })
})

describe('LintResultSchema', () => {
  test.each([
    {
      description: 'valid lint result with no issues',
      lintResult: testData.lintResult({
        issues: [],
        errorCount: 0,
        warningCount: 0,
      }),
      expectedSuccess: true,
    },
    {
      description: 'valid lint result with issues',
      lintResult: testData.lintResult(),
      expectedSuccess: true,
    },
    {
      description: 'without timestamp',
      lintResult: testData.lintResultWithout(['timestamp']),
      expectedSuccess: false,
    },
    {
      description: 'without files',
      lintResult: testData.lintResultWithout(['files']),
      expectedSuccess: false,
    },
    {
      description: 'without issues',
      lintResult: testData.lintResultWithout(['issues']),
      expectedSuccess: false,
    },
    {
      description: 'without errorCount',
      lintResult: testData.lintResultWithout(['errorCount']),
      expectedSuccess: false,
    },
    {
      description: 'without warningCount',
      lintResult: testData.lintResultWithout(['warningCount']),
      expectedSuccess: false,
    },
  ])('$description', ({ lintResult, expectedSuccess }) => {
    const result = LintResultSchema.safeParse(lintResult)
    expect(result.success).toBe(expectedSuccess)
  })
})

describe('LintDataSchema', () => {
  test.each([
    {
      description: 'valid lint data with notification flag false',
      lintData: testData.lintData({
        hasNotifiedAboutLintIssues: false,
      }),
      expectedSuccess: true,
    },
    {
      description: 'valid lint data with notification flag true',
      lintData: testData.lintData({
        hasNotifiedAboutLintIssues: true,
      }),
      expectedSuccess: true,
    },
    {
      description: 'without hasNotifiedAboutLintIssues',
      lintData: testData.lintDataWithout(['hasNotifiedAboutLintIssues']),
      expectedSuccess: false,
    },
    {
      description: 'extends LintResultSchema - valid with all base fields',
      lintData: testData.lintData(),
      expectedSuccess: true,
    },
    {
      description: 'extends LintResultSchema - invalid without base timestamp',
      lintData: testData.lintDataWithout(['timestamp']),
      expectedSuccess: false,
    },
    {
      description: 'extends LintResultSchema - invalid without base files',
      lintData: testData.lintDataWithout(['files']),
      expectedSuccess: false,
    },
  ])('$description', ({ lintData, expectedSuccess }) => {
    const result = LintDataSchema.safeParse(lintData)
    expect(result.success).toBe(expectedSuccess)
  })
})

describe('ESLintMessageSchema', () => {
  test.each([
    {
      description: 'valid ESLint message with all fields',
      message: testData.eslintMessage(),
      expectedSuccess: true,
    },
    {
      description: 'valid without optional line',
      message: testData.eslintMessageWithout(['line']),
      expectedSuccess: true,
    },
    {
      description: 'valid without optional column',
      message: testData.eslintMessageWithout(['column']),
      expectedSuccess: true,
    },
    {
      description: 'valid without optional ruleId',
      message: testData.eslintMessageWithout(['ruleId']),
      expectedSuccess: true,
    },
    {
      description: 'without required severity',
      message: testData.eslintMessageWithout(['severity']),
      expectedSuccess: false,
    },
    {
      description: 'without required message',
      message: testData.eslintMessageWithout(['message']),
      expectedSuccess: false,
    },
    {
      description: 'with invalid severity type',
      message: {
        ...testData.eslintMessage(),
        severity: 'error',
      },
      expectedSuccess: false,
    },
  ])('$description', ({ message, expectedSuccess }) => {
    const result = ESLintMessageSchema.safeParse(message)
    expect(result.success).toBe(expectedSuccess)
  })
})

describe('ESLintResultSchema', () => {
  test.each([
    {
      description: 'valid ESLint result with messages',
      result: testData.eslintResult(),
      expectedSuccess: true,
    },
    {
      description: 'valid without optional messages',
      result: testData.eslintResultWithout(['messages']),
      expectedSuccess: true,
    },
    {
      description: 'valid with empty messages array',
      result: testData.eslintResult({ messages: [] }),
      expectedSuccess: true,
    },
    {
      description: 'without required filePath',
      result: testData.eslintResultWithout(['filePath']),
      expectedSuccess: false,
    },
    {
      description: 'with invalid messages type',
      result: {
        ...testData.eslintResult(),
        messages: 'not-an-array',
      },
      expectedSuccess: false,
    },
  ])('$description', ({ result, expectedSuccess }) => {
    const parseResult = ESLintResultSchema.safeParse(result)
    expect(parseResult.success).toBe(expectedSuccess)
  })
})

describe('GolangciLintPositionSchema', () => {
  test.each([
    {
      description: 'valid position with all fields',
      position: testData.golangciLintPosition(),
      expectedSuccess: true,
    },
    {
      description: 'without required Filename',
      position: testData.golangciLintPositionWithout(['Filename']),
      expectedSuccess: false,
    },
    {
      description: 'without required Line',
      position: testData.golangciLintPositionWithout(['Line']),
      expectedSuccess: false,
    },
    {
      description: 'without required Column',
      position: testData.golangciLintPositionWithout(['Column']),
      expectedSuccess: false,
    },
    {
      description: 'with invalid Line type',
      position: {
        ...testData.golangciLintPosition(),
        Line: '10',
      },
      expectedSuccess: false,
    },
  ])('$description', ({ position, expectedSuccess }) => {
    const result = GolangciLintPositionSchema.safeParse(position)
    expect(result.success).toBe(expectedSuccess)
  })
})

describe('GolangciLintIssueSchema', () => {
  test.each([
    {
      description: 'valid issue with all fields',
      issue: testData.golangciLintIssue(),
      expectedSuccess: true,
    },
    {
      description: 'without required FromLinter',
      issue: testData.golangciLintIssueWithout(['FromLinter']),
      expectedSuccess: false,
    },
    {
      description: 'without required Text',
      issue: testData.golangciLintIssueWithout(['Text']),
      expectedSuccess: false,
    },
    {
      description: 'without required Pos',
      issue: testData.golangciLintIssueWithout(['Pos']),
      expectedSuccess: false,
    },
    {
      description: 'with invalid Pos structure',
      issue: {
        ...testData.golangciLintIssue(),
        Pos: {
          ...testData.golangciLintPosition(),
          Line: 'invalid',
        },
      },
      expectedSuccess: false,
    },
  ])('$description', ({ issue, expectedSuccess }) => {
    const result = GolangciLintIssueSchema.safeParse(issue)
    expect(result.success).toBe(expectedSuccess)
  })
})

describe('GolangciLintResultSchema', () => {
  test.each([
    {
      description: 'valid result with Issues array',
      result: testData.golangciLintResult(),
      expectedSuccess: true,
    },
    {
      description: 'valid result with empty Issues array',
      result: testData.golangciLintResult({ Issues: [] }),
      expectedSuccess: true,
    },
    {
      description: 'valid result without Issues (undefined)',
      result: testData.golangciLintResultWithout(['Issues']),
      expectedSuccess: true,
    },
    {
      description: 'invalid result with malformed issue in Issues array',
      result: testData.golangciLintResult({
        Issues: [testData.golangciLintIssueWithout(['Text'])],
      }),
      expectedSuccess: false,
    },
    {
      description: 'invalid result with non-array Issues',
      result: {
        ...testData.golangciLintResult(),
        Issues: 'not-an-array',
      },
      expectedSuccess: false,
    },
  ])('$description', ({ result, expectedSuccess }) => {
    const parseResult = GolangciLintResultSchema.safeParse(result)
    expect(parseResult.success).toBe(expectedSuccess)
  })
})

describe('RuboCopLocationSchema', () => {
  test.each([
    {
      description: 'valid location with all fields',
      location: testData.ruboCopLocation(),
      expectedSuccess: true,
    },
    {
      description: 'without required line',
      location: testData.ruboCopLocationWithout(['line']),
      expectedSuccess: false,
    },
    {
      description: 'without required column',
      location: testData.ruboCopLocationWithout(['column']),
      expectedSuccess: false,
    },
    {
      description: 'with invalid line type',
      location: {
        ...testData.ruboCopLocation(),
        line: '10',
      },
      expectedSuccess: false,
    },
  ])('$description', ({ location, expectedSuccess }) => {
    const result = RuboCopLocationSchema.safeParse(location)
    expect(result.success).toBe(expectedSuccess)
  })
})

describe('RuboCopOffenseSchema', () => {
  test.each([
    {
      description: 'valid offense with all fields',
      offense: testData.ruboCopOffense(),
      expectedSuccess: true,
    },
    {
      description: 'without required severity',
      offense: testData.ruboCopOffenseWithout(['severity']),
      expectedSuccess: false,
    },
    {
      description: 'without required message',
      offense: testData.ruboCopOffenseWithout(['message']),
      expectedSuccess: false,
    },
    {
      description: 'without required cop_name',
      offense: testData.ruboCopOffenseWithout(['cop_name']),
      expectedSuccess: false,
    },
    {
      description: 'without required location',
      offense: testData.ruboCopOffenseWithout(['location']),
      expectedSuccess: false,
    },
    {
      description: 'with invalid location structure',
      offense: {
        ...testData.ruboCopOffense(),
        location: {
          ...testData.ruboCopLocation(),
          line: 'invalid',
        },
      },
      expectedSuccess: false,
    },
  ])('$description', ({ offense, expectedSuccess }) => {
    const result = RuboCopOffenseSchema.safeParse(offense)
    expect(result.success).toBe(expectedSuccess)
  })
})

describe('RuboCopFileSchema', () => {
  test.each([
    {
      description: 'valid file with offenses array',
      file: testData.ruboCopFile(),
      expectedSuccess: true,
    },
    {
      description: 'valid file with empty offenses array',
      file: testData.ruboCopFile({ offenses: [] }),
      expectedSuccess: true,
    },
    {
      description: 'without required path',
      file: testData.ruboCopFileWithout(['path']),
      expectedSuccess: false,
    },
    {
      description: 'without required offenses',
      file: testData.ruboCopFileWithout(['offenses']),
      expectedSuccess: false,
    },
    {
      description: 'with malformed offense in offenses array',
      file: testData.ruboCopFile({
        offenses: [testData.ruboCopOffenseWithout(['message'])],
      }),
      expectedSuccess: false,
    },
  ])('$description', ({ file, expectedSuccess }) => {
    const result = RuboCopFileSchema.safeParse(file)
    expect(result.success).toBe(expectedSuccess)
  })
})

describe('RuboCopResultSchema', () => {
  test.each([
    {
      description: 'valid result with files array',
      result: testData.ruboCopResult(),
      expectedSuccess: true,
    },
    {
      description: 'valid result with empty files array',
      result: testData.ruboCopResult({ files: [] }),
      expectedSuccess: true,
    },
    {
      description: 'without required files',
      result: testData.ruboCopResultWithout(['files']),
      expectedSuccess: false,
    },
    {
      description: 'with non-array files',
      result: {
        ...testData.ruboCopResult(),
        files: 'not-an-array',
      },
      expectedSuccess: false,
    },
  ])('$description', ({ result, expectedSuccess }) => {
    const parseResult = RuboCopResultSchema.safeParse(result)
    expect(parseResult.success).toBe(expectedSuccess)
  })
})
