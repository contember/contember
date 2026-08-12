import { beforeAll, describe, expect, test } from 'bun:test'
import chalk from 'chalk'
import { escapeTerminalText, Output, OutputStream, OutputTableColumn } from '../../../src/index.js'
import { createTestOutput } from '../../lib/testOutput.js'

beforeAll(() => {
	// deterministic assertions regardless of the terminal the suite runs in
	chalk.level = 0
})

describe('Output.data', () => {
	test('human mode uses the formatter', () => {
		const { output, stdout, stderr } = createTestOutput()
		output.setMode('human')
		output.data('1.2.3', it => it)
		expect(stdout.text).toBe('1.2.3\n')
		expect(stderr.text).toBe('')
	})

	test('human mode falls back to JSON when no formatter is given', () => {
		const { output, stdout } = createTestOutput()
		output.setMode('human')
		output.data({ a: 1 })
		expect(stdout.text).toBe('{\n  "a": 1\n}\n')
	})

	test('json mode ignores the formatter', () => {
		const { output, stdout } = createTestOutput()
		output.setMode('json')
		output.data('1.2.3', () => 'human form')
		expect(stdout.text).toBe('"1.2.3"\n')
	})

	test('quiet mode prints bare scalars, one per line', () => {
		const { output, stdout } = createTestOutput()
		output.setMode('quiet')
		output.data(['a', 'b', 'c'], () => 'human form')
		expect(stdout.text).toBe('a\nb\nc\n')
	})

	test('quiet mode prints a bare scalar', () => {
		const { output, stdout } = createTestOutput()
		output.setMode('quiet')
		output.data('1.2.3', it => it)
		expect(stdout.text).toBe('1.2.3\n')
	})

	test('quiet mode uses an explicit typed projection', () => {
		const { output, stdout } = createTestOutput()
		output.setMode('quiet')
		output.data({ id: 'project-1', name: 'Blog' }, {
			human: value => value.name,
			quiet: value => value.id,
		})
		expect(stdout.text).toBe('project-1\n')
	})

	test('json mode ignores all projections', () => {
		const { output, stdout } = createTestOutput()
		const value = { id: 'project-1', name: 'Blog' }
		output.setMode('json')
		output.data(value, { human: item => item.name, quiet: item => item.id })
		expect(JSON.parse(stdout.text)).toStrictEqual(value)
	})
})

describe('Output.table', () => {
	interface Row {
		id: string
		name: string
	}
	const columns: { field: keyof Row & string; name: string }[] = [{ field: 'id', name: 'ID' }, { field: 'name', name: 'Name' }]
	const rows: Row[] = [{ id: '1', name: 'first' }, { id: '2', name: 'second' }]

	test('human mode renders a table on stdout', () => {
		const { output, stdout, stderr } = createTestOutput()
		output.setMode('human')
		output.table(columns, rows)
		expect(stdout.text).toContain('first')
		expect(stdout.text).toContain('Name')
		expect(stderr.text).toBe('')
	})

	test('json mode prints the bare row array', () => {
		const { output, stdout } = createTestOutput()
		output.setMode('json')
		output.table(columns, rows)
		expect(JSON.parse(stdout.text)).toStrictEqual(rows)
	})

	test('quiet mode prints the quiet column only', () => {
		const { output, stdout } = createTestOutput()
		output.setMode('quiet')
		output.table(columns, rows, 'name')
		expect(stdout.text).toBe('first\nsecond\n')
	})

	test('quiet mode falls back to the first column', () => {
		const { output, stdout } = createTestOutput()
		output.setMode('quiet')
		output.table(columns, rows)
		expect(stdout.text).toBe('1\n2\n')
	})
})

describe('Output.table column formatter', () => {
	interface EventRow {
		id: string
		numRetries: number
		log: { message: string }[]
	}
	// each formatter sees the exact type of its own field — no narrowing, no cast
	const columns: OutputTableColumn<EventRow>[] = [
		{ field: 'id', name: 'ID', format: value => `#${value}` },
		{ field: 'numRetries', name: 'Retries' },
		{ field: 'log', name: 'Log', format: (value, row) => `${row.id}:${value[value.length - 1]?.message ?? '(none)'}` },
	]
	const rows: EventRow[] = [
		{ id: '1', numRetries: 2, log: [{ message: 'first' }, { message: 'last' }] },
		{ id: '2', numRetries: 0, log: [] },
	]

	test('human mode applies the formatter and leaves unformatted columns raw', () => {
		const { output, stdout } = createTestOutput()
		output.setMode('human')
		output.table(columns, rows)
		expect(stdout.text).toContain('#1')
		expect(stdout.text).toContain('1:last')
		expect(stdout.text).toContain('2:(none)')
		// the summarised column must not leak the whole structure into the cell
		expect(stdout.text).not.toContain('first')
		// a column without a formatter still renders the raw value (numRetries of the second row)
		expect(stdout.text).toContain('0')
	})

	test('json mode keeps the raw rows, ignoring the formatter', () => {
		const { output, stdout } = createTestOutput()
		output.setMode('json')
		output.table(columns, rows)
		expect(JSON.parse(stdout.text)).toStrictEqual(rows)
	})

	test('quiet mode keeps the raw value of the quiet column, ignoring the formatter', () => {
		const { output, stdout } = createTestOutput()
		output.setMode('quiet')
		output.table(columns, rows, 'id')
		expect(stdout.text).toBe('1\n2\n')
	})

	test('the v1 column shape without a formatter still compiles and renders', () => {
		const legacyColumns: { field: keyof EventRow & string; name: string }[] = [{ field: 'id', name: 'ID' }]
		const { output, stdout } = createTestOutput()
		output.setMode('human')
		output.table(legacyColumns, rows)
		expect(stdout.text).toContain('ID')
		expect(stdout.text).not.toContain('#1')
	})
})

describe('Output.list', () => {
	test('json mode prints a JSON array', () => {
		const { output, stdout } = createTestOutput()
		output.setMode('json')
		output.list(['a', 'b'])
		expect(JSON.parse(stdout.text)).toStrictEqual(['a', 'b'])
	})

	test('quiet mode prints one value per line', () => {
		const { output, stdout } = createTestOutput()
		output.setMode('quiet')
		output.list(['a', 'b'])
		expect(stdout.text).toBe('a\nb\n')
	})
})

describe('Output diagnostics', () => {
	test('go to stderr in human mode', () => {
		const { output, stdout, stderr } = createTestOutput()
		output.setMode('human')
		output.info('info message')
		output.warn('warn message')
		output.error('error message')
		expect(stdout.text).toBe('')
		expect(stderr.lines).toStrictEqual(['info message', 'warn message', 'error message'])
	})

	test('are suppressed in json mode', () => {
		const { output, stdout, stderr } = createTestOutput()
		output.setMode('json')
		output.info('info message')
		output.data({ a: 1 })
		expect(JSON.parse(stdout.text)).toStrictEqual({ a: 1 })
		expect(stderr.text).toBe('')
	})

	test('are suppressed in quiet mode', () => {
		const { output, stderr } = createTestOutput()
		output.setMode('quiet')
		output.info('info message')
		output.warn('warn message')
		output.error('error message')
		expect(stderr.text).toBe('')
	})

	test('writeStderr is never suppressed', () => {
		const { output, stdout, stderr } = createTestOutput()
		output.setMode('quiet')
		output.writeStderr('always visible')
		expect(stdout.text).toBe('')
		expect(stderr.text).toBe('always visible\n')
	})
})

describe('terminal escaping', () => {
	test('removes C0, C1, and escape controls', () => {
		expect(escapeTerminalText('a\u0000b\u001bc\u0085d')).toBe('abcd')
	})

	test('preserves printable boundary, Unicode, and astral characters', () => {
		expect(escapeTerminalText('\u001f \u007e\u007f\u0080\u009f\u00a0Příliš žluťoučký 🐘')).toBe(' \u007e\u00a0Příliš žluťoučký 🐘')
	})

	test('sanitizes untrusted list, table, and diagnostic values in human mode', () => {
		const { output, stdout, stderr } = createTestOutput()
		output.setMode('human')
		output.list(['list\u001b[31m'])
		output.table([{ field: 'value', name: 'Value' }], [{ value: 'cell\u0007\u001b]8;;https://example.test' }])
		output.warn('warning\u001b[2J')
		expect(stdout.text).not.toContain('\u001b')
		expect(stdout.text).not.toContain('\u0007')
		expect(stderr.text).not.toContain('\u001b')
		expect(stdout.text).toContain('list[31m')
		expect(stderr.text).toContain('warning[2J')
	})
})

class StreamWriteError extends Error {
	constructor(public readonly code: string) {
		super(code)
	}
}

class FailingStream implements OutputStream {
	public readonly isTty = false

	constructor(private readonly error: Error) {}

	public write(): void {
		throw this.error
	}
}

class ErrorEmittingStream implements OutputStream {
	public readonly isTty = false
	private readonly listeners: ((error: unknown) => void)[] = []

	public write(): void {
	}

	public onError(listener: (error: unknown) => void): void {
		this.listeners.push(listener)
	}

	public emitError(error: unknown): void {
		for (const listener of this.listeners) {
			listener(error)
		}
	}
}

describe('stream errors', () => {
	test('treats an injected EPIPE as a closed consumer', () => {
		const output = new Output({ stdout: new FailingStream(new StreamWriteError('EPIPE')) })
		expect(() => output.data('ignored', value => value)).not.toThrow()
	})

	test('does not hide unrelated injected stream errors', () => {
		const output = new Output({ stdout: new FailingStream(new StreamWriteError('EIO')) })
		expect(() => output.data('broken', value => value)).toThrow('EIO')
	})

	test('handles asynchronous stream errors through the injected error channel', () => {
		const stream = new ErrorEmittingStream()
		new Output({ stdout: stream })
		expect(() => stream.emitError(new StreamWriteError('EPIPE'))).not.toThrow()
		expect(() => stream.emitError(new StreamWriteError('EIO'))).toThrow('EIO')
	})
})

describe('Output.progress', () => {
	test('is written only on a TTY in human mode', () => {
		const { output, stderr } = createTestOutput({ stderrTty: true })
		output.setMode('human')
		output.progress('working')
		expect(stderr.text).toBe('working')
		output.clearProgress()
		expect(stderr.text).toBe('working\r\u001b[K')
	})

	test('is skipped when stderr is not a TTY', () => {
		const { output, stderr } = createTestOutput({ stderrTty: false })
		output.setMode('human')
		output.progress('working')
		expect(stderr.text).toBe('')
	})

	test('is skipped in json mode even on a TTY', () => {
		const { output, stderr } = createTestOutput({ stderrTty: true })
		output.setMode('json')
		output.progress('working')
		expect(stderr.text).toBe('')
	})
})

describe('Output.canPrompt', () => {
	test('is true only in human mode on a TTY', () => {
		const { output } = createTestOutput({ stdinTty: true })
		output.setMode('human')
		expect(output.canPrompt()).toBe(true)
		output.setMode('json')
		expect(output.canPrompt()).toBe(false)
		output.setMode('quiet')
		expect(output.canPrompt()).toBe(false)
	})

	test('is false without a TTY', () => {
		const { output } = createTestOutput({ stdinTty: false })
		output.setMode('human')
		expect(output.canPrompt()).toBe(false)
	})
})

describe('Output.applyGlobalOptions', () => {
	test('picks json over quiet', () => {
		const { output } = createTestOutput()
		output.applyGlobalOptions({ json: true, quiet: true, color: true, help: false })
		expect(output.mode).toBe('json')
		expect(output.isJson).toBe(true)
	})

	test('picks quiet', () => {
		const { output } = createTestOutput()
		output.applyGlobalOptions({ json: false, quiet: true, color: true, help: false })
		expect(output.mode).toBe('quiet')
		expect(output.isQuiet).toBe(true)
	})

	test('defaults to human', () => {
		const { output } = createTestOutput()
		output.applyGlobalOptions({ json: false, quiet: false, color: true, help: false })
		expect(output.mode).toBe('human')
	})

	test('--no-color turns chalk off', () => {
		const { output } = createTestOutput()
		chalk.level = 3
		output.applyGlobalOptions({ json: false, quiet: false, color: false, help: false })
		expect(chalk.level).toBe(0)
	})
})
