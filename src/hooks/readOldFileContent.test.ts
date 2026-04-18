import { afterEach, describe, it, expect } from 'vitest'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { readOldFileContent } from './readOldFileContent'

describe('readOldFileContent', () => {
  const tempDirs: string[] = []

  afterEach(async () => {
    while (tempDirs.length) {
      const dir = tempDirs.pop()!
      await rm(dir, { recursive: true, force: true })
    }
  })

  const makeDir = async (prefix: string): Promise<string> => {
    const dir = await mkdtemp(join(tmpdir(), prefix))
    tempDirs.push(dir)
    return dir
  }

  it('returns empty string when the file does not exist', async () => {
    const missingPath = join(tmpdir(), 'tdd-guard-missing-file-xyz.txt')
    await expect(readOldFileContent(missingPath)).resolves.toBe('')
  })

  it('returns the file contents when the file exists', async () => {
    const dir = await makeDir('tdd-guard-read-')
    const filePath = join(dir, 'existing.txt')
    await writeFile(filePath, 'hello world', 'utf-8')
    await expect(readOldFileContent(filePath)).resolves.toBe('hello world')
  })

  it('rethrows when the path points at a directory (EISDIR)', async () => {
    const dir = await makeDir('tdd-guard-eisdir-')
    await expect(readOldFileContent(dir)).rejects.toThrow()
  })

  it('returns empty string when the file exists but is empty', async () => {
    const dir = await makeDir('tdd-guard-empty-')
    const filePath = join(dir, 'empty.txt')
    await writeFile(filePath, '', 'utf-8')
    await expect(readOldFileContent(filePath)).resolves.toBe('')
  })

  it('returns empty string when the file exceeds the size cap', async () => {
    const dir = await makeDir('tdd-guard-large-')
    const filePath = join(dir, 'huge.txt')
    await writeFile(filePath, Buffer.alloc(300_000, 'x'))
    await expect(readOldFileContent(filePath)).resolves.toBe('')
  })
})
