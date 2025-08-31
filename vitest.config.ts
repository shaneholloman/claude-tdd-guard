import { defineConfig } from 'vitest/config'
import { VitestReporter } from 'tdd-guard-vitest'
import path from 'path'

const root = path.resolve(__dirname)

export default defineConfig({
  test: {
    reporters: ['default', new VitestReporter(root)],
    projects: [
      {
        test: {
          globals: true,
          environment: 'node',
          testTimeout: 120000,
          include: ['src/linters/golangci/**/*.test.ts'],
          pool: 'forks', // Use forks for golangci tests that need process.chdir
          exclude: ['**/node_modules/**', '**/dist/**', '**/artifacts/**'],
        },
        resolve: {
          alias: {
            '@testUtils': path.resolve(__dirname, './test/utils/index.ts'),
          },
        },
      },
      {
        test: {
          globals: true,
          environment: 'node',
          testTimeout: 120000,
          include: ['**/*.test.ts'],
          exclude: [
            'src/linters/golangci/**/*.test.ts',
            '**/node_modules/**',
            '**/dist/**',
            '**/artifacts/**',
            '**/test/integration/validator.scenarios.test.ts', // Extensive test suite - run separately for faster feedback
          ],
          pool: 'threads', // Use threads for all other tests
        },
        resolve: {
          alias: {
            '@testUtils': path.resolve(__dirname, './test/utils/index.ts'),
          },
        },
      },
    ],
  },
  resolve: {
    alias: {
      '@testUtils': path.resolve(__dirname, './test/utils/index.ts'),
    },
  },
})
