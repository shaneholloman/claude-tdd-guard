import { readFile, stat } from 'node:fs/promises'

const MAX_OLD_CONTENT_BYTES = 262_144

export async function readOldFileContent(filePath: string): Promise<string> {
  try {
    const stats = await stat(filePath)
    if (stats.size > MAX_OLD_CONTENT_BYTES) return ''
    return await readFile(filePath, 'utf-8')
  } catch (error) {
    if (
      error instanceof Error &&
      (error as Error & { code?: string }).code === 'ENOENT'
    ) {
      return ''
    }
    throw error
  }
}
