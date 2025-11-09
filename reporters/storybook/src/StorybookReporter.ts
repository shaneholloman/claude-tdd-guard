import { Storage, FileStorage, Config } from 'tdd-guard'
import type {
  StorybookReporterOptions,
  TestContext,
  TestRunOutput,
  StoryTest,
  StoryModule,
} from './types'

export class StorybookReporter {
  private readonly storage: Storage

  constructor(storageOrRoot?: Storage | string) {
    this.storage = this.initializeStorage(storageOrRoot)
  }

  private initializeStorage(
    storageOrRoot?: Storage | string
  ): Storage {
    if (!storageOrRoot) {
      return new FileStorage()
    }

    if (typeof storageOrRoot === 'string') {
      const config = new Config({ projectRoot: storageOrRoot })
      return new FileStorage(config)
    }

    return storageOrRoot
  }

  async onStoryResult(_context: TestContext): Promise<void> {
    // To be implemented
  }

  async onComplete(): Promise<void> {
    // To be implemented
  }
}
