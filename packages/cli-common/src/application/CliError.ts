import { InvalidInputError } from './InputParser.js'

export enum ExitCode {
	Success = 0,
	/** invalid input / validation */
	InputError = 1,
	/** unexpected, a bug */
	InternalError = 2,
	NotFound = 3,
	/** network, timeout, 5xx — the caller SHOULD retry */
	Transient = 4,
	/** already exists */
	Conflict = 5,
	/** auth / permission denied */
	Forbidden = 6,
}

export interface CliErrorOptions {
	/** stable machine-readable slug, e.g. 'PROJECT_NOT_DEFINED' */
	code: string
	exitCode?: ExitCode
	retryable?: boolean
	details?: unknown
	cause?: unknown
}

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

export class CliError extends Error {
	public readonly code: string
	public readonly exitCode: ExitCode
	public readonly retryable: boolean
	public readonly details?: JsonValue

	constructor(message: string, options: CliErrorOptions) {
		super(message, { cause: options.cause })
		this.name = 'CliError'
		this.code = options.code
		this.exitCode = options.exitCode ?? ExitCode.InputError
		this.retryable = options.retryable ?? this.exitCode === ExitCode.Transient
		this.details = normalizeJsonValue(options.details)
	}
}

const unexpectedCliErrors = new WeakSet<CliError>()

export const isUnexpectedCliError = (error: CliError): boolean => unexpectedCliErrors.has(error)

/**
 * Normalizes anything thrown by a command into a {@link CliError}. Legacy `throw 'some message'` is
 * treated as an input error, everything else unexpected as an internal one.
 */
export const toCliError = (error: unknown): CliError => {
	if (error instanceof CliError) {
		return error
	}
	if (error instanceof InvalidInputError) {
		return new CliError(error.message, { code: 'INVALID_INPUT', exitCode: ExitCode.InputError, cause: error })
	}
	if (typeof error === 'string') {
		return new CliError(error, { code: 'ERROR', exitCode: ExitCode.InputError })
	}
	if (error instanceof Error) {
		const cliError = new CliError(error.message, { code: 'UNKNOWN', exitCode: ExitCode.InternalError, details: error.stack, cause: error })
		unexpectedCliErrors.add(cliError)
		return cliError
	}
	const cliError = new CliError(safeString(error), { code: 'UNKNOWN', exitCode: ExitCode.InternalError, details: error })
	unexpectedCliErrors.add(cliError)
	return cliError
}

const safeString = (value: unknown): string => {
	try {
		return String(value)
	} catch {
		return 'Unknown error'
	}
}

export const normalizeJsonValue = (value: unknown): JsonValue | undefined => normalizeValue(value, new WeakSet())

const normalizeValue = (value: unknown, ancestors: WeakSet<object>): JsonValue | undefined => {
	if (value === undefined) {
		return undefined
	}
	if (value === null || typeof value === 'string' || typeof value === 'boolean') {
		return value
	}
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : String(value)
	}
	if (typeof value === 'bigint' || typeof value === 'symbol' || typeof value === 'function') {
		return safeString(value)
	}
	if (ancestors.has(value)) {
		return '[Circular]'
	}
	ancestors.add(value)
	try {
		if (Array.isArray(value)) {
			return value.map(item => normalizeValue(item, ancestors) ?? null)
		}
		const result: { [key: string]: JsonValue } = {}
		for (const [key, item] of Object.entries(value)) {
			const normalized = normalizeValue(item, ancestors)
			if (normalized !== undefined) {
				result[key] = normalized
			}
		}
		return result
	} catch {
		return safeString(value)
	} finally {
		ancestors.delete(value)
	}
}
