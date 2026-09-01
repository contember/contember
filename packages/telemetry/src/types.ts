export type AttributeValue = string | number | boolean | readonly string[] | readonly number[] | readonly boolean[]

export type Attributes = Record<string, AttributeValue>

export interface SpanContext {
	traceId: string
	spanId: string
	traceFlags: number
	traceState?: string
}

export type SpanKind = 'internal' | 'server' | 'client' | 'producer' | 'consumer'

export type SpanStatusCode = 'unset' | 'ok' | 'error'

export interface SpanStatus {
	code: SpanStatusCode
	message?: string
}

export interface SpanLink {
	context: SpanContext
	attributes?: Attributes
}

export interface SpanEvent {
	name: string
	timeUnixNano: bigint
	attributes?: Attributes
}

export interface SpanOptions {
	kind?: SpanKind
	attributes?: Attributes
	links?: SpanLink[]
}

export interface Span {
	readonly context: SpanContext
	readonly isRecording: boolean

	setAttribute(key: string, value: AttributeValue): this
	setAttributes(attributes: Attributes): this
	addEvent(name: string, attributes?: Attributes): this
	addLink(context: SpanContext, attributes?: Attributes): this
	recordException(error: unknown): this
	setStatus(code: SpanStatusCode, message?: string): this
	end(): void
}

export interface Tracer {
	span<T>(name: string, cb: (span: Span) => T, options?: SpanOptions): T
	startSpan(name: string, options?: SpanOptions & { parent?: SpanContext }): Span
	activeSpanContext(): SpanContext | undefined
}

export interface ReadableSpan {
	name: string
	context: SpanContext
	parentSpanId?: string
	kind: SpanKind
	startTimeUnixNano: bigint
	endTimeUnixNano: bigint
	attributes: Attributes
	events: SpanEvent[]
	links: SpanLink[]
	status: SpanStatus
}

export interface SamplerInput {
	traceId: string
	name: string
	parent?: SpanContext
}

export interface Sampler {
	shouldSample(input: SamplerInput): boolean
}

export interface SpanProcessor {
	onEnd(span: ReadableSpan): void
	forceFlush(): Promise<void>
	shutdown(): Promise<void>
}

export interface SpanExporter {
	export(spans: readonly ReadableSpan[]): Promise<void>
	shutdown(): Promise<void>
}

export interface Resource {
	serviceName: string
	attributes?: Attributes
}
