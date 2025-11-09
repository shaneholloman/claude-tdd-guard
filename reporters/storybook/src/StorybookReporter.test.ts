import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { StorybookReporter } from './StorybookReporter'
import {
  MemoryStorage,
  FileStorage,
  Storage,
  Config,
  DEFAULT_DATA_DIR,
} from 'tdd-guard'
import {
  createStoryContext,
  passedStoryContext,
  failedStoryContext,
} from './StorybookReporter.test-data'
import { rmSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('StorybookReporter', () => {
  it('uses FileStorage by default', () => {
    const reporter = new StorybookReporter()
    expect(reporter['storage']).toBeInstanceOf(FileStorage)
  })
})
