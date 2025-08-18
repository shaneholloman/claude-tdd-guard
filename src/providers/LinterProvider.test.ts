import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { LinterProvider } from './LinterProvider'
import { Config } from '../config/Config'
import { ESLint } from '../linters/eslint/ESLint'
import { GolangciLint } from '../linters/golangci/GolangciLint'

describe('LinterProvider', () => {
  let originalLinterType: string | undefined

  beforeEach(() => {
    // Save original environment variable
    originalLinterType = process.env.LINTER_TYPE
  })

  afterEach(() => {
    // Restore original environment variable
    if (originalLinterType === undefined) {
      delete process.env.LINTER_TYPE
    } else {
      process.env.LINTER_TYPE = originalLinterType
    }
  })

  test('returns ESLint when config linterType is eslint', () => {
    const config = new Config({ linterType: 'eslint' })

    const provider = new LinterProvider()
    const linter = provider.getLinter(config)

    expect(linter).toBeInstanceOf(ESLint)
  })

  test('returns GolangciLint when config linterType is golangci-lint', () => {
    const config = new Config({ linterType: 'golangci-lint' })

    const provider = new LinterProvider()
    const linter = provider.getLinter(config)

    expect(linter).toBeInstanceOf(GolangciLint)
  })

  test('returns null when config linterType is explicitly undefined', () => {
    const config = new Config({ linterType: undefined })

    const provider = new LinterProvider()
    const linter = provider.getLinter(config)

    expect(linter).toBeNull()
  })

  test('returns null when config linterType is unknown value', () => {
    const config = new Config({ linterType: 'unknown-linter' })

    const provider = new LinterProvider()
    const linter = provider.getLinter(config)

    expect(linter).toBeNull()
  })

  describe('with environment variables', () => {
    test('returns ESLint when LINTER_TYPE env var is eslint', () => {
      process.env.LINTER_TYPE = 'eslint'

      const provider = new LinterProvider()
      const linter = provider.getLinter()

      expect(linter).toBeInstanceOf(ESLint)
    })

    test('returns GolangciLint when LINTER_TYPE env var is golangci-lint', () => {
      process.env.LINTER_TYPE = 'golangci-lint'

      const provider = new LinterProvider()
      const linter = provider.getLinter()

      expect(linter).toBeInstanceOf(GolangciLint)
    })

    test('returns null when LINTER_TYPE env var is unset', () => {
      delete process.env.LINTER_TYPE

      const provider = new LinterProvider()
      const linter = provider.getLinter()

      expect(linter).toBeNull()
    })

    test('returns null when LINTER_TYPE env var is empty string', () => {
      process.env.LINTER_TYPE = ''

      const provider = new LinterProvider()
      const linter = provider.getLinter()

      expect(linter).toBeNull()
    })

    test('returns null when LINTER_TYPE env var is unknown value', () => {
      process.env.LINTER_TYPE = 'unknown-linter'

      const provider = new LinterProvider()
      const linter = provider.getLinter()

      expect(linter).toBeNull()
    })
  })
})
