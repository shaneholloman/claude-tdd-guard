import { open } from 'node:fs/promises'

const MAX_OLD_CONTENT_BYTES = 262_144

export async function readOldFileContent(filePath: string): Promise<string> {
  let handle: Awaited<ReturnType<typeof open>> | undefined
  try {
    handle = await open(filePath, 'r')
    const stats = await handle.stat()
    if (stats.size > MAX_OLD_CONTENT_BYTES) return ''
    return await handle.readFile('utf-8')
  } catch (error) {
    if (
      error instanceof Error &&
      (error as Error & { code?: string }).code === 'ENOENT'
    ) {
      return ''
    }
    throw error
  } finally {
    await handle?.close()
  }
}
