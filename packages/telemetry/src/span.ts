import {
	Attributes,
	AttributeValue,
	ReadableSpan,
	Span,
	SpanContext,
	SpanEvent,
	SpanKind,
	SpanLink,
	SpanOptions,
	SpanStatus,
	SpanStatusCode,
} from './types.js'

export const nowUnixNano = (): bigint => BigInt(Math.round((performance.timeOrigin + performance.now()) * 1e6))

export class SpanImpl implements Span {
	public readonly isRecording = true

	private readonly startTimeUnixNano = nowUnixNano()
	private readonly attributes: Attributes
	private readonly events: SpanEvent[] = []
	private readonly links: SpanLink[]
	private readonly kind: SpanKind
	private status: SpanStatus = { code: 'unset' }
	private endTimeUnixNano: bigint | undefined

	constructor(
		private readonly name: string,
		public readonly context: SpanContext,
		private readonly parentSpanId: string | undefined,
		options: SpanOptions | undefined,
		private readonly onEnd: (span: ReadableSpan) => void,
	) {
		this.kind = options?.kind ?? 'internal'
		this.attributes = { ...options?.attributes }
		this.links = [...options?.links ?? []]
	}

	setAttribute(key: string, value: AttributeValue): this {
		if (this.endTimeUnixNano === undefined) {
			this.attributes[key] = value
		}
		return this
	}

	setAttributes(attributes: Attributes): this {
		for (const [key, value] of Object.entries(attributes)) {
			this.setAttribute(key, value)
		}
		return this
	}

	addEvent(name: string, attributes?: Attributes): this {
		if (this.endTimeUnixNano === undefined) {
			this.events.push({ name, timeUnixNano: nowUnixNano(), attributes })
		}
		return this
	}

	addLink(context: SpanContext, attributes?: Attributes): this {
		if (this.endTimeUnixNano === undefined) {
			this.links.push({ context, attributes })
		}
		return this
	}

	recordException(error: unknown): this {
		return this.addEvent('exception', describeException(error))
	}

	setStatus(code: SpanStatusCode, message?: string): this {
		if (this.endTimeUnixNano === undefined) {
			this.status = { code, message }
		}
		return this
	}

	end(): void {
		if (this.endTimeUnixNano !== undefined) {
			return
		}
		this.endTimeUnixNano = nowUnixNano()
		this.onEnd({
			name: this.name,
			context: this.context,
			parentSpanId: this.parentSpanId,
			kind: this.kind,
			startTimeUnixNano: this.startTimeUnixNano,
			endTimeUnixNano: this.endTimeUnixNano,
			attributes: { ...this.attributes },
			events: this.events,
			links: this.links,
			status: this.status,
		})
	}
}

export class NonRecordingSpan implements Span {
	public readonly isRecording = false

	constructor(
		public readonly context: SpanContext,
	) {
	}

	setAttribute(): this {
		return this
	}

	setAttributes(): this {
		return this
	}

	addEvent(): this {
		return this
	}

	addLink(): this {
		return this
	}

	recordException(): this {
		return this
	}

	setStatus(): this {
		return this
	}

	end(): void {
	}
}

const describeException = (error: unknown): Attributes => {
	if (!(error instanceof Error)) {
		return { 'exception.message': String(error) }
	}
	const attributes: Attributes = { 'exception.type': error.name, 'exception.message': error.message }
	if (error.stack !== undefined) {
		attributes['exception.stacktrace'] = error.stack
	}
	return attributes
}
