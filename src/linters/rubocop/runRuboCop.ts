import { execFile } from 'child_process'
import { promisify } from 'util'

export type RunRuboCop = (
  args: string[],
  opts: { shell: boolean }
) => Promise<{ stdout: string | Buffer; stderr: string | Buffer }>

const execFileAsync = promisify(execFile)

export const runRuboCop: RunRuboCop = async (args, opts) =>
  execFileAsync('rubocop', args, opts)
