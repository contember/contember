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
import { describeException, sanitizeAttributes, sanitizeAttributeValue, sanitizeStatusMessage } from './sanitize.js'

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
		this.attributes = sanitizeAttributes(options?.attributes)
		this.links = (options?.links ?? []).map(link => ({
			context: link.context,
			...link.attributes === undefined ? {} : { attributes: sanitizeAttributes(link.attributes) },
		}))
	}

	setAttribute(key: string, value: AttributeValue): this {
		if (this.endTimeUnixNano === undefined) {
			this.attributes[key] = sanitizeAttributeValue(key, value)
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
			this.events.push({ name, timeUnixNano: nowUnixNano(), attributes: attributes === undefined ? undefined : sanitizeAttributes(attributes) })
		}
		return this
	}

	addLink(context: SpanContext, attributes?: Attributes): this {
		if (this.endTimeUnixNano === undefined) {
			this.links.push({ context, attributes: attributes === undefined ? undefined : sanitizeAttributes(attributes) })
		}
		return this
	}

	recordException(error: unknown): this {
		return this.addEvent('exception', describeException(error))
	}

	setStatus(code: SpanStatusCode, message?: string): this {
		if (this.endTimeUnixNano === undefined) {
			this.status = { code, message: message === undefined ? undefined : sanitizeStatusMessage(message) }
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
