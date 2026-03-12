const TEST_FILE_PATTERNS = [
  /\.test\./,
  /\.spec\./,
  /(?:^|[\\/])tests?[\\/]/,
  /(?:^|[\\/])__tests__[\\/]/,
  /_test\.go$/,
  /Test\.php$/,
  /(?:^|[\\/])test_[^/\\]+\.py$/,
  /(?:^|[\\/])spec[\\/]/,
  /_spec\.rb$/,
]

export function isTestFile(filePath: string): boolean {
  return TEST_FILE_PATTERNS.some((pattern) => pattern.test(filePath))
}

export type Language = 'typescript' | 'javascript' | 'python' | 'go' | 'ruby' | 'php' | 'rust'

const EXTENSION_TO_LANGUAGE: Record<string, Language> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.py': 'python',
  '.go': 'go',
  '.rb': 'ruby',
  '.php': 'php',
  '.rs': 'rust',
}

export function detectLanguage(filePath: string): Language | null {
  const lastDotIndex = filePath.lastIndexOf('.')
  if (lastDotIndex === -1) return null
  const extension = filePath.slice(lastDotIndex)
  return EXTENSION_TO_LANGUAGE[extension] ?? null
}

export function detectFileType(hookData: unknown): 'python' | 'javascript' | 'php' {
  // Handle different tool operation types
  const toolInput = (hookData as { tool_input?: Record<string, unknown> }).tool_input
  if (toolInput && typeof toolInput === 'object' && 'file_path' in toolInput) {
    const filePath = toolInput.file_path
    if (typeof filePath === 'string') {
      if (filePath.endsWith('.py')) {
        return 'python'
      }
      if (filePath.endsWith('.php')) {
        return 'php'
      }
    }
  }
  return 'javascript'
}