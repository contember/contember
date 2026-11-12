import { createInterface, type Interface } from 'node:readline'
import type { Readable } from 'node:stream'
import { CliError, ExitCode } from './CliError.js'
import { setColorsEnabled, style, terminalSupportsColor } from './colors.js'
import type { GlobalOptionValues } from './GlobalOptions.js'
import { formatTable } from './table.js'

export type OutputMode = 'human' | 'json' | 'quiet'

export interface OutputStream {
	write(text: string): void
	readonly isTty: boolean
	readonly columns?: number
	onError?(listener: (error: unknown) => void): void
}

/** Reads one line of the user's answer, or `undefined` when the input is closed. */
export type PromptLineReader = () => Promise<string | undefined>

export interface OutputOptions {
	stdout?: OutputStream
	stderr?: OutputStream
	isStdinTty?: () => boolean
	readPromptLine?: PromptLineReader
}

export type OutputScalar = string | number | boolean | bigint | null | undefined

export interface OutputDataOptions<T> {
	human?: (value: T) => string
	quiet?: (value: T) => OutputScalar | readonly OutputScalar[]
}

/**
 * Per field column specs, so that each `format` sees the exact type of its own field. Indexed by the
 * field name only to let {@link Output.table} render a cell without widening the union.
 */
export type OutputTableColumns<T> = {
	[K in keyof T & string]: {
		field: K
		name: string
		/** Human mode only — `--json` still emits the raw row and `--quiet` the raw value. */
		format?: (value: T[K], row: T) => string
	}
}

export type OutputTableColumn<T> = OutputTableColumns<T>[keyof T & string]

export const resolveOutputMode = (globals: GlobalOptionValues): OutputMode => {
	if (globals.json) {
		return 'json'
	}
	if (globals.quiet) {
		return 'quiet'
	}
	return 'human'
}

/**
 * The single output channel of the CLI: stdout carries data, stderr carries everything a human reads.
 *
 * The instance is created before argv is parsed, so the mode is mutable and set by `Application` once
 * the global options are known. Every consumer holds the same instance.
 */
export class Output {
	private currentMode: OutputMode = 'human'
	private progressVisible = false
	private readonly stdout: OutputStream
	private readonly stderr: OutputStream
	private readonly stdinIsTty: () => boolean
	private readonly readPromptLine: PromptLineReader

	constructor(options: OutputOptions = {}) {
		this.stdout = options.stdout ?? createProcessStream(process.stdout)
		this.stderr = options.stderr ?? createProcessStream(process.stderr)
		this.stdinIsTty = options.isStdinTty ?? (() => process.stdin.isTTY === true)
		this.readPromptLine = options.readPromptLine ?? readStdinLine
		this.stdout.onError?.(handleStreamError)
		this.stderr.onError?.(handleStreamError)
	}

	public get mode(): OutputMode {
		return this.currentMode
	}

	public get isJson(): boolean {
		return this.currentMode === 'json'
	}

	public get isQuiet(): boolean {
		return this.currentMode === 'quiet'
	}

	/** Set by `Application` once the global options are parsed. */
	public setMode(mode: OutputMode): void {
		this.currentMode = mode
	}

	public applyGlobalOptions(globals: GlobalOptionValues): void {
		this.setMode(resolveOutputMode(globals))
		setColorsEnabled(globals.color && this.currentMode === 'human' && terminalSupportsColor)
	}

	// DATA → stdout

	/** Prints command data with optional mode-specific projections. JSON always receives the raw value. */
	public data<T>(value: T, human?: (value: T) => string): void
	public data<T>(value: T, options?: OutputDataOptions<T>): void
	public data<T>(value: T, rendering?: ((value: T) => string) | OutputDataOptions<T>): void {
		const human = typeof rendering === 'function' ? rendering : rendering?.human
		if (this.currentMode === 'json') {
			this.writeStdout(JSON.stringify(value ?? null, null, 2))
			return
		}
		if (this.currentMode === 'quiet') {
			const quietValue = typeof rendering === 'object' && rendering.quiet ? rendering.quiet(value) : value
			for (const line of toScalarLines(quietValue)) {
				this.writeStdout(line)
			}
			return
		}
		this.writeStdout(human ? human(value) : JSON.stringify(value ?? null, null, 2))
	}

	public table<T>(columns: OutputTableColumn<T>[], rows: T[], quietField?: keyof T & string): void {
		if (this.currentMode === 'json') {
			this.writeStdout(JSON.stringify(rows, null, 2))
			return
		}
		if (this.currentMode === 'quiet') {
			const field = quietField ?? columns[0]?.field
			if (field === undefined) {
				return
			}
			for (const row of rows) {
				this.writeStdout(formatCell(row[field]))
			}
			return
		}
		if (rows.length === 0) {
			return
		}
		const data = rows.map(row => {
			const cells: Partial<Record<keyof T & string, string>> = {}
			for (const column of columns) {
				cells[column.field] = renderTableCell(column, row)
			}
			return cells
		})
		this.writeStdout(formatTable(columns.map(it => ({ field: it.field, name: it.name })), data))
	}

	// DIAGNOSTICS → stderr

	public info(message: string): void {
		this.writeDiagnostic(message)
	}

	public warn(message: string): void {
		this.writeDiagnostic(message, text => style('yellow', text))
	}

	public error(message: string): void {
		this.writeDiagnostic(message, text => style('red', text))
	}

	// PROGRESS → stderr

	public progress(message: string): void {
		if (this.currentMode !== 'human' || !this.stderr.isTty) {
			return
		}
		this.clearProgress()
		writeStream(this.stderr, escapeTerminalText(message))
		this.progressVisible = true
	}

	public clearProgress(): void {
		if (!this.progressVisible) {
			return
		}
		this.progressVisible = false
		writeStream(this.stderr, '\r\u001b[K')
	}

	/** False unless both sides of an interactive prompt are TTYs in human mode. */
	public canPrompt(): boolean {
		return this.currentMode === 'human' && this.stdinIsTty() && this.stderr.isTty
	}

	/** Writes `question` to stderr and reads one answer line. */
	public prompt(question: string): Promise<string | undefined> {
		if (!this.canPrompt()) {
			throw new CliError('TTY not available. Pass --yes to confirm.', { code: 'TTY_UNAVAILABLE', exitCode: ExitCode.InputError })
		}
		this.clearProgress()
		writeStream(this.stderr, question)
		return this.readPromptLine()
	}

	/**
	 * Writes a line to stderr regardless of the mode. Reserved for content the user explicitly asked for
	 * (help) or must always see (a fatal error) — everything else belongs to the methods above.
	 */
	public writeStderr(text: string): void {
		this.clearProgress()
		writeStream(this.stderr, text + '\n')
	}

	private writeStdout(text: string): void {
		this.clearProgress()
		writeStream(this.stdout, text + '\n')
	}

	private writeDiagnostic(message: string, format: (text: string) => string = text => text): void {
		if (this.currentMode !== 'human') {
			return
		}
		this.clearProgress()
		writeStream(this.stderr, format(escapeTerminalText(message)) + '\n')
	}
}

const createProcessStream = (stream: NodeJS.WriteStream): OutputStream => ({
	write: text => {
		stream.write(text)
	},
	get isTty() {
		return stream.isTTY === true
	},
	get columns() {
		return stream.columns
	},
	onError: listener => {
		stream.on('error', error => listener(error))
	},
})

let stdinReader: LineReader | undefined
const readStdinLine: PromptLineReader = () => {
	stdinReader ??= new LineReader(process.stdin)
	return stdinReader.read()
}

/**
 * Reads answer lines from one input for all prompts, so that a line typed or pasted ahead of the next prompt is kept
 * and an input that already ended reads as closed. Not in readline's terminal mode: the TTY handles line editing and
 * echo, and Ctrl+C stays a plain SIGINT.
 */
export class LineReader {
	private reader: Interface | undefined
	private readonly lines: string[] = []
	private waiting: ((line: string | undefined) => void) | undefined
	private closed = false

	constructor(private readonly input: Readable) {}

	public read(): Promise<string | undefined> {
		if (this.waiting) {
			throw new Error('LineReader: a read is already pending')
		}
		const line = this.lines.shift()
		if (line !== undefined) {
			return Promise.resolve(line)
		}
		// readline never reports `close` for an input that ended before it was attached (Bun does not set readableEnded)
		if (this.closed || this.input.readableEnded) {
			this.closed = true
			return Promise.resolve(undefined)
		}
		return new Promise(resolve => {
			this.waiting = resolve
			this.open().resume()
		})
	}

	private open(): Interface {
		if (this.reader) {
			return this.reader
		}
		const reader = createInterface({ input: this.input, terminal: false })
		reader.on('line', line => this.settle(line))
		reader.on('close', () => {
			this.closed = true
			this.settle(undefined)
		})
		this.reader = reader
		return reader
	}

	private settle(line: string | undefined): void {
		const waiting = this.waiting
		if (!waiting) {
			if (line !== undefined) {
				this.lines.push(line)
			}
			return
		}
		this.waiting = undefined
		if (!this.closed) {
			// a paused TTY does not keep the process alive between prompts; Node throws when pausing a closed interface
			this.reader?.pause()
		}
		waiting(line)
	}
}

const writeStream = (stream: OutputStream, text: string): void => {
	try {
		stream.write(text)
	} catch (error) {
		handleStreamError(error)
	}
}

const handleStreamError = (error: unknown): void => {
	if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'EPIPE') {
		return
	}
	throw error
}

/** Removes terminal control characters from untrusted human-readable text. */
export const escapeTerminalText = (value: string): string => {
	let escaped = ''
	for (const character of value) {
		if (!isTerminalControl(character)) {
			escaped += character
		}
	}
	return escaped
}

const isTerminalControl = (character: string): boolean => {
	const codePoint = character.codePointAt(0)
	return codePoint !== undefined && (codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f))
}

// generic in the field so that `format` is a single signature here, not a union of them
const renderTableCell = <T, K extends keyof T & string>(column: OutputTableColumns<T>[K], row: T): string =>
	column.format ? column.format(row[column.field], row) : formatCell(row[column.field])

const formatCell = (value: unknown): string => {
	if (value === undefined || value === null) {
		return ''
	}
	if (typeof value === 'string') {
		return escapeTerminalText(value)
	}
	if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
		return String(value)
	}
	return JSON.stringify(value) ?? ''
}

const toScalarLines = (value: unknown): string[] => {
	const values: unknown[] = Array.isArray(value) ? value : [value]
	if (!values.every(isOutputScalar)) {
		throw new TypeError('Quiet output requires a scalar value or an array of scalar values. Pass an explicit quiet projection for structured data.')
	}
	return values.filter(it => it !== undefined && it !== null).map(formatCell)
}

const isOutputScalar = (value: unknown): value is OutputScalar =>
	value === null || value === undefined || ['string', 'number', 'boolean', 'bigint'].includes(typeof value)
