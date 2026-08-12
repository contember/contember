import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process'
import { Readable, Writable } from 'node:stream'
import { StringDecoder } from 'node:string_decoder'
import { Output } from '../application/Output.js'

export type RunningCommand = { child: ChildProcessWithoutNullStreams; output: Promise<string> }

export class CommandRunner {
	constructor(private readonly output: Output = new Output()) {
	}

	runCommand = (
		command: string,
		args: (string | undefined)[],
		options: {
			cwd: string
			stdin?: Readable
			stdout?: Writable
			stderr?: Writable
			env?: NodeJS.ProcessEnv
			detached?: boolean
			/** Human-safe command summary. Never include raw arguments or credentials. */
			display?: string
		},
	): RunningCommand => {
		const args2 = args.filter((it): it is string => it !== undefined)
		if (!process.env.DISABLE_COMMAND_PRINTING && options.display !== undefined) {
			this.output.info(`$ ${options.display}`)
		}
		const child = spawn(command, args2, {
			cwd: options.cwd,
			env: { ...process.env, ...(options.env || {}) },
			detached: options.detached,
		})
		const stdoutChunks: Buffer[] = []
		const stderrChunks: Buffer[] = []
		const stdoutDiagnostics = new DiagnosticForwarder(this.output)
		const stderrDiagnostics = new DiagnosticForwarder(this.output)
		const humanMode = this.output.mode === 'human'
		const stdoutTarget = humanMode ? options.stdout : undefined
		const stderrTarget = humanMode ? options.stderr : undefined

		child.stdout.on('data', (chunk: Buffer): void => {
			stdoutChunks.push(chunk)
			if (stdoutTarget === undefined) {
				stdoutDiagnostics.write(chunk)
			}
		})

		child.stderr.on('data', (chunk: Buffer): void => {
			stderrChunks.push(chunk)
			if (stderrTarget === undefined) {
				stderrDiagnostics.write(chunk)
			}
		})
		if (stdoutTarget !== undefined) {
			child.stdout.pipe(stdoutTarget)
		}
		if (stderrTarget !== undefined) {
			child.stderr.pipe(stderrTarget)
		}

		let rejectInput: (error: Error) => void = () => undefined
		const inputFailure = new Promise<never>((_resolve, reject) => {
			rejectInput = reject
		})
		const stopSupervisingInput = options.stdin === undefined
			? () => undefined
			: superviseInput(options.stdin, child, rejectInput)

		const childOutput = new Promise<string>((resolve, reject) => {
			let spawnCause: Error | undefined
			child.once('error', (error): void => {
				spawnCause = error
			})
			child.once('close', (exitCode, signal): void => {
				stopSupervisingInput()
				stdoutDiagnostics.end()
				stderrDiagnostics.end()
				const stdout = Buffer.concat(stdoutChunks).toString()
				const stderr = Buffer.concat(stderrChunks).toString()
				if (spawnCause === undefined && signal === null && exitCode === 0) {
					resolve(stdout)
				} else {
					reject(new ChildProcessError(spawnCause === undefined ? exitCode : null, stdout, stderr, { cause: spawnCause, signal }))
				}
			})
		})
		const output = options.stdin === undefined ? childOutput : Promise.race([childOutput, inputFailure])

		return { output, child }
	}
}

export interface ChildProcessErrorOptions {
	readonly cause?: Error
	readonly signal?: NodeJS.Signals | null
}

export class ChildProcessError extends Error {
	public readonly stdout: string
	public readonly stderr: string
	public readonly signal: NodeJS.Signals | null
	public override readonly cause: Error | undefined

	constructor(exitCode: number | null, stderr: string)
	constructor(
		exitCode: number | null,
		stdout: string,
		stderr: string,
		options?: ChildProcessErrorOptions,
	)
	constructor(
		public readonly exitCode: number | null,
		stdoutOrStderr: string,
		stderr?: string,
		options: ChildProcessErrorOptions = {},
	) {
		const legacySignature = stderr === undefined
		const stdout = legacySignature ? '' : stdoutOrStderr
		const capturedStderr = legacySignature ? stdoutOrStderr : stderr
		const signal = options.signal ?? null
		const message = options.cause !== undefined
			? 'Command could not be started.'
			: signal !== null
			? `Command terminated by signal ${signal}.`
			: `Command failed with exit code ${exitCode}.`
		super(message)
		this.name = 'ChildProcessError'
		this.stdout = stdout
		this.stderr = capturedStderr
		this.signal = signal
		this.cause = options.cause
	}
}

const superviseInput = (
	source: Readable,
	child: ChildProcessWithoutNullStreams,
	reject: (error: Error) => void,
): () => void => {
	let stopped = false
	const stop = (): void => {
		if (stopped) {
			return
		}
		stopped = true
		source.unpipe(child.stdin)
		source.off('error', onSourceError)
		child.stdin.off('error', onDestinationError)
	}
	const fail = (error: Error): void => {
		stop()
		child.stdin.destroy()
		if (child.exitCode === null && child.signalCode === null) {
			child.kill()
		}
		reject(error)
	}
	const onSourceError = (error: Error): void => {
		fail(error)
	}
	const onDestinationError = (error: Error): void => {
		if (isErrorCode(error, 'EPIPE')) {
			stop()
			return
		}
		fail(error)
	}

	source.once('error', onSourceError)
	child.stdin.once('error', onDestinationError)
	source.pipe(child.stdin)
	return stop
}

const isErrorCode = (error: Error, code: string): boolean => 'code' in error && error.code === code

/** Streams child output as human diagnostics without allowing it to corrupt JSON or quiet output. */
class DiagnosticForwarder {
	private readonly decoder = new StringDecoder()
	private pending = ''

	constructor(private readonly output: Output) {
	}

	public write(chunk: Buffer): void {
		this.consume(this.decoder.write(chunk))
	}

	public end(): void {
		this.consume(this.decoder.end())
		if (this.pending !== '') {
			this.output.info(this.pending)
			this.pending = ''
		}
	}

	private consume(text: string): void {
		this.pending += text
		while (true) {
			const separator = this.pending.search(/[\r\n]/)
			if (separator === -1) {
				return
			}
			this.output.info(this.pending.slice(0, separator))
			const separatorLength = this.pending[separator] === '\r' && this.pending[separator + 1] === '\n' ? 2 : 1
			this.pending = this.pending.slice(separator + separatorLength)
		}
	}
}
