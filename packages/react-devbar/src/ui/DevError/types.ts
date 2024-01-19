export type ParsedStackTrace = ParsedStackFrame[]

export interface ParsedStackFrame {
	filename: string
	thirdParty: boolean
	line?: number
	callee?: string
	sourceCodeLines?: string[]
}

export type ErrorType = Error | unknown

export interface ProcessedError {
	error: ErrorType
	parsedStackStrace?: ParsedStackTrace
	cause?: ProcessedError
}
