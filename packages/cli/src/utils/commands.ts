import { spawn } from 'child_process'
import { Readable, Writable } from 'stream'

export const execCommand = (
	command: string,
	args: string[],
	options: { cwd: string; stdin?: Readable; stdout?: Writable; stderr?: Writable; env?: NodeJS.ProcessEnv },
): Promise<string> => {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			cwd: options.cwd,
			env: { ...process.env, ...(options.env || {}) },
		})
		if (options.stdin) {
			options.stdin.pipe(child.stdin)
		}

		let stdout = ''
		let stderr = ''

		child.stdout.on('data', (chunk): void => {
			stdout += chunk.toString()
		})

		child.stderr.on('data', (chunk): void => {
			stderr += chunk.toString()
		})

		child.on('exit', (exitCode): void => {
			if (exitCode === 0) {
				resolve(stdout)
			} else {
				reject({ exitCode, stderr })
			}
		})
		if (options.stdout) {
			child.stdout.pipe(options.stdout)
		}
		if (options.stderr) {
			child.stderr.pipe(options.stderr)
		}
	})
}
