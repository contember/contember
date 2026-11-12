export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'

export interface StackFrame {
	filename?: string
	module?: string
	function?: string
	lineno?: number
	colno?: number
	in_app?: boolean
	pre_context?: string[]
	context_line?: string
	post_context?: string[]
}

export interface Mechanism {
	type: string
	handled: boolean
	synthetic?: boolean
	is_exception_group?: boolean
	source?: string
	exception_id?: number
	parent_id?: number
}

export interface ExceptionValue {
	type: string
	value: string
	stacktrace?: { frames: StackFrame[] }
	mechanism?: Mechanism
}

export interface RequestData {
	url?: string
	method?: string
	data?: unknown
}

export interface User {
	id?: string
	[key: string]: unknown
}

export interface SentryEvent {
	event_id: string
	timestamp: number
	platform: 'node'
	level: SeverityLevel
	server_name?: string
	release?: string
	environment?: string
	message?: string
	logger?: string
	exception?: { values: ExceptionValue[] }
	tags?: Record<string, string>
	user?: User
	extra?: Record<string, unknown>
	request?: RequestData
	contexts?: Record<string, Record<string, unknown>>
	sdk?: { name: string; version: string }
}

/** What a single capture adds to the event. Values that are `undefined` are left out. */
export interface Scope {
	readonly level?: SeverityLevel
	readonly tags?: Readonly<Record<string, string | undefined>>
	readonly user?: User
	readonly extra?: Readonly<Record<string, unknown>>
	readonly request?: RequestData
	/** Merged into the event contexts; `trace` is `{ trace_id, span_id }` of the request being handled. */
	readonly contexts?: Readonly<Record<string, Record<string, unknown>>>
}
