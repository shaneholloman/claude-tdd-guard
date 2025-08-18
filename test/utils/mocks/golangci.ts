import type { ExecFileException, execFile } from 'child_process'
import type { MockedFunction } from 'vitest'

export interface GolangciIssue {
  FromLinter: string
  Text: string
  Pos: {
    Filename: string
    Line: number
    Column: number
  }
}

export interface GolangciOutput {
  Issues: GolangciIssue[]
}

export const createGolangciMockResponse = (): {
  withIssues: () => GolangciOutput
  withoutIssues: () => GolangciOutput
  version: () => string
} => {
  const mockIssues: GolangciIssue[] = [
    {
      FromLinter: 'typecheck',
      Text: 'undefined: messag',
      Pos: {
        Filename: 'test/artifacts/file-with-issues.go',
        Line: 9,
        Column: 14,
      },
    },
    {
      FromLinter: 'ineffassign',
      Text: 'ineffectual assignment to unused',
      Pos: {
        Filename: 'test/artifacts/file-with-issues.go',
        Line: 6,
        Column: 2,
      },
    },
    {
      FromLinter: 'typecheck',
      Text: 'unused variable',
      Pos: {
        Filename: 'test/artifacts/file-with-issues.go',
        Line: 6,
        Column: 2,
      },
    },
  ]

  return {
    withIssues: (): GolangciOutput => ({ Issues: mockIssues }),
    withoutIssues: (): GolangciOutput => ({ Issues: [] }),
    version: () => 'golangci-lint has version 1.55.2',
  }
}

export const setupGolangciMock = (
  mockExecFile: MockedFunction<typeof execFile>
): void => {
  const responses = createGolangciMockResponse()

  mockExecFile.mockImplementation(((...args: Parameters<typeof execFile>) => {
    const [command, argsOrCallback, callbackOrOptions, maybeCallback] = args

    let actualArgs: readonly string[] = []
    let callback: (
      error: ExecFileException | null,
      stdout: string,
      stderr: string
    ) => void

    if (Array.isArray(argsOrCallback)) {
      actualArgs = argsOrCallback
      callback = (callbackOrOptions ?? maybeCallback) as typeof callback
    } else if (typeof argsOrCallback === 'function') {
      callback = argsOrCallback as typeof callback
    } else {
      callback = (callbackOrOptions ?? maybeCallback) as typeof callback
    }

    if (command === 'golangci-lint' && actualArgs[0] === '--version') {
      callback(null, responses.version(), '')
      return {} as ReturnType<typeof execFile>
    }

    if (
      command === 'golangci-lint' &&
      actualArgs.some((arg: string) => arg.includes('file-with-issues.go'))
    ) {
      const mockOutput = JSON.stringify(responses.withIssues())
      const error = new Error('golangci-lint found issues') as ExecFileException

      error.stdout = mockOutput
      callback(error, '', '')
      return {} as ReturnType<typeof execFile>
    }

    // No issues found for other files
    callback(null, '', '')
    return {} as ReturnType<typeof execFile>
  }) as typeof execFile)
}
