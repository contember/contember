import { Attributes, AttributeValue } from './types.js'

const MAX_EXPORTED_STRING_LENGTH = 4096
const STACK_FRAME_PATTERN = /^\s*at (?:.*:\d+:\d+\)?|.*\(<anonymous>\))$/

const truncateString = (value: string): string => value.slice(0, MAX_EXPORTED_STRING_LENGTH)

const firstLine = (value: string): string => value.split(/\r\n|\r|\n/, 1)[0] ?? ''

const sanitizeStacktrace = (value: string, safeHeading?: string): string => {
	const [heading = '', ...continuation] = value.split(/\r\n|\r|\n/)
	const frames = continuation.filter(line => STACK_FRAME_PATTERN.test(line))
	return truncateString([safeHeading ?? heading, ...frames].join('\n'))
}

const sanitizeAttributeString = (key: string, value: string): string => {
	if (key === 'exception.message') {
		return truncateString(firstLine(value))
	}
	if (key === 'exception.stacktrace') {
		return sanitizeStacktrace(value)
	}
	return truncateString(value)
}

const isStringArray = (value: AttributeValue): value is readonly string[] => Array.isArray(value) && value.every(item => typeof item === 'string')

export const sanitizeAttributeValue = (key: string, value: AttributeValue): AttributeValue => {
	if (typeof value === 'string') {
		return sanitizeAttributeString(key, value)
	}
	if (isStringArray(value)) {
		return value.map(item => truncateString(item))
	}
	return value
}

export const sanitizeAttributes = (attributes: Attributes | undefined): Attributes => {
	const sanitized: Attributes = {}
	for (const [key, value] of Object.entries(attributes ?? {})) {
		sanitized[key] = sanitizeAttributeValue(key, value)
	}
	return sanitized
}

export const sanitizeStatusMessage = (message: string): string => truncateString(firstLine(message))

const safeStringify = (value: unknown): string => {
	try {
		return String(value)
	} catch {
		return 'Unknown exception'
	}
}

export const describeExceptionMessage = (error: unknown): string => {
	if (!(error instanceof Error)) {
		return sanitizeAttributeString('exception.message', safeStringify(error))
	}
	if ('sql' in error && 'parameters' in error) {
		return 'Database query failed'
	}
	try {
		return sanitizeAttributeString('exception.message', error.message)
	} catch {
		return sanitizeAttributeString('exception.message', safeStringify(error))
	}
}

export const describeException = (error: unknown): Attributes => {
	if (!(error instanceof Error)) {
		return { 'exception.message': describeExceptionMessage(error) }
	}
	let type = 'Error'
	let stack: string | undefined
	try {
		type = error.name
	} catch {
	}
	try {
		stack = error.stack
	} catch {
	}
	const message = describeExceptionMessage(error)
	let code: string | number | undefined
	if ('code' in error && (typeof error.code === 'string' || typeof error.code === 'number')) {
		code = error.code
	}
	return sanitizeAttributes({
		'exception.type': type,
		'exception.message': message,
		...code === undefined ? {} : { 'exception.code': code },
		...stack === undefined ? {} : { 'exception.stacktrace': sanitizeStacktrace(stack, `${type}: ${message}`) },
	})
}
