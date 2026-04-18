import { describe, test } from 'vitest'
import { validator } from '../../src/validation/validator'
import { Context } from '../../src/contracts/types/Context'
import { Config } from '../../src/config/Config'
import { ModelClientProvider } from '../../src/providers/ModelClientProvider'
import { testData } from '../utils'
import { expectDecision } from '../utils/factories/scenarios'

const { createEditOperation, createWriteOperation, languages } = testData

describe('Core Validator Scenarios', () => {
  const config = new Config({ mode: 'test' })
  const provider = new ModelClientProvider()
  const model = provider.getModelClient(config)

  languages.forEach((lang) => {
    const { methodStubReturning0, methodImplementation, empty, completeClass } =
      lang.implementationModifications

    describe(`${lang.language} scenarios`, () => {
      describe('Edit', () => {
        test('should allow making a failing test pass', async () => {
          const oldContent = methodStubReturning0.content
          const newContent = methodImplementation.content
          const operation = createEditOperation(
            lang.implementationFile,
            oldContent,
            newContent
          )
          const context: Context = {
            modifications: operation,
            todo: JSON.stringify(lang.todos.methodInProgress.content),
            test: lang.testResults.assertionError.content,
          }

          const result = await validator(context, model)
          expectDecision(result, undefined)
        })

        test('should block premature implementation', async () => {
          const oldContent = empty.content
          const newContent = completeClass.content
          const operation = createEditOperation(
            lang.implementationFile,
            oldContent,
            newContent
          )
          const context: Context = {
            modifications: operation,
            todo: JSON.stringify(lang.todos.methodInProgress.content),
            test: lang.testResults.notDefined.content,
          }

          const result = await validator(context, model)
          expectDecision(result, 'block')
        })

        test('should block adding multiple tests at once', async () => {
          const oldContent =
            lang.testModifications.emptyTestContainerWithImports.content
          const newContent =
            lang.testModifications.multipleTestsWithImports.content
          const operation = createEditOperation(
            lang.testFile,
            oldContent,
            newContent
          )
          const context: Context = {
            modifications: operation,
            todo: JSON.stringify(lang.todos.empty.content),
            test: lang.testResults.empty.content,
          }

          const result = await validator(context, model)
          expectDecision(result, 'block')
        })

        test('should allow test refactoring when tests are passing', async () => {
          const oldContent = lang.testModifications.multipleTests.content
          const newContent = lang.testModifications.refactoredTests.content
          const operation = createEditOperation(
            lang.testFile,
            oldContent,
            newContent
          )
          const context: Context = {
            modifications: operation,
            todo: JSON.stringify(lang.todos.empty.content),
            test: lang.testResults.passing.content,
          }

          const result = await validator(context, model)
          expectDecision(result, undefined)
        })
      })

      describe('Write', () => {
        test('should allow writing a new test file with a single test', async () => {
          const operation = createWriteOperation(
            lang.testFile,
            lang.testModifications.singleTestComplete.content
          )
          const context: Context = {
            modifications: operation,
            todo: JSON.stringify(lang.todos.empty.content),
            test: lang.testResults.empty.content,
          }

          const result = await validator(context, model)
          expectDecision(result, undefined)
        })

        test('should block writing a new test file with multiple tests', async () => {
          const operation = createWriteOperation(
            lang.testFile,
            lang.testModifications.multipleTestsWithImports.content
          )
          const context: Context = {
            modifications: operation,
            todo: JSON.stringify(lang.todos.empty.content),
            test: lang.testResults.empty.content,
          }

          const result = await validator(context, model)
          expectDecision(result, 'block')
        })
      })

      describe('Overwrite', () => {
        test('should allow adding one new test to an existing test file', async () => {
          const operation = createWriteOperation(
            lang.testFile,
            lang.testModifications.multipleTestsWithImports.content,
            lang.testModifications.singleTestComplete.content
          )
          const context: Context = {
            modifications: operation,
            todo: JSON.stringify(lang.todos.empty.content),
            test: lang.testResults.passing.content,
          }

          const result = await validator(context, model)
          expectDecision(result, undefined)
        })

        test('should block overwriting by adding multiple tests at once', async () => {
          const operation = createWriteOperation(
            lang.testFile,
            lang.testModifications.multipleTestsWithImports.content,
            lang.testModifications.emptyTestContainerWithImports.content
          )
          const context: Context = {
            modifications: operation,
            todo: JSON.stringify(lang.todos.empty.content),
            test: lang.testResults.empty.content,
          }

          const result = await validator(context, model)
          expectDecision(result, 'block')
        })
      })
    })
  })
})
