import { execFile } from 'child_process'
import { promisify } from 'util'

export type RunEslint = (
  args: string[],
  opts: { shell: boolean }
) => Promise<{ stdout: string | Buffer; stderr: string | Buffer }>

const execFileAsync = promisify(execFile)

export const runEslint: RunEslint = async (args, opts) =>
  execFileAsync('npx', args, opts)
