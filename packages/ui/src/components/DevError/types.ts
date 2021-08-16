export type ParsedStackTrace = ParsedStackFrame[]

export interface ParsedStackFrame {
	filename: string
	thirdParty: boolean
	line?: number
	callee?: string
	sourceCodeLines?: string[]
}

export type ErrorType = Error | unknown
