import type { Storage } from 'tdd-guard'

export interface StorybookReporterOptions {
  storage?: Storage
  projectRoot?: string
}

export interface StoryError {
  message: string
  stack?: string
  expected?: unknown
  actual?: unknown
}

export interface StoryTest {
  name: string
  fullName: string
  state: 'passed' | 'failed' | 'skipped'
  errors?: StoryError[]
}

export interface StoryModule {
  moduleId: string
  tests: StoryTest[]
}

export interface TestRunOutput {
  testModules: StoryModule[]
  unhandledErrors: unknown[]
  reason?: 'passed' | 'failed' | 'interrupted'
}

export interface TestContext {
  id: string
  title: string
  storyExport: {
    name: string
  }
  status?: 'passed' | 'failed' | 'skipped'
  errors?: unknown[]
}
