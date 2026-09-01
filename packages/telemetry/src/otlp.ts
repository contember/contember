import { Attributes, AttributeValue, ReadableSpan, Resource, SpanKind, SpanStatusCode } from './types.js'

export const SCOPE_NAME = '@contember/telemetry'

const SPAN_KIND_CODES: Record<SpanKind, number> = { internal: 1, server: 2, client: 3, producer: 4, consumer: 5 }

const SPAN_STATUS_CODES: Record<SpanStatusCode, number> = { unset: 0, ok: 1, error: 2 }

export type OtlpValue =
	| { stringValue: string }
	| { boolValue: boolean }
	| { intValue: string }
	| { doubleValue: number }
	| { arrayValue: { values: OtlpValue[] } }

export interface OtlpKeyValue {
	key: string
	value: OtlpValue
}

export interface OtlpEvent {
	name: string
	timeUnixNano: string
	attributes: OtlpKeyValue[]
}

export interface OtlpLink {
	traceId: string
	spanId: string
	traceState?: string
	attributes: OtlpKeyValue[]
}

export interface OtlpSpan {
	traceId: string
	spanId: string
	parentSpanId?: string
	traceState?: string
	name: string
	kind: number
	startTimeUnixNano: string
	endTimeUnixNano: string
	attributes: OtlpKeyValue[]
	events: OtlpEvent[]
	links: OtlpLink[]
	status?: { code: number; message?: string }
}

export interface OtlpTracePayload {
	resourceSpans: {
		resource: { attributes: OtlpKeyValue[] }
		scopeSpans: { scope: { name: string }; spans: OtlpSpan[] }[]
	}[]
}

const encodePrimitive = (value: string | number | boolean): OtlpValue => {
	if (typeof value === 'string') {
		return { stringValue: value }
	}
	if (typeof value === 'boolean') {
		return { boolValue: value }
	}
	return Number.isSafeInteger(value) ? { intValue: String(value) } : { doubleValue: value }
}

const encodeValue = (value: AttributeValue): OtlpValue => {
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return encodePrimitive(value)
	}
	const values: OtlpValue[] = []
	for (const item of value) {
		values.push(encodePrimitive(item))
	}
	return { arrayValue: { values } }
}

export const encodeAttributes = (attributes: Attributes | undefined): OtlpKeyValue[] =>
	Object.entries(attributes ?? {}).map(([key, value]) => ({ key, value: encodeValue(value) }))

export const encodeSpan = (span: ReadableSpan): OtlpSpan => ({
	traceId: span.context.traceId,
	spanId: span.context.spanId,
	...span.parentSpanId !== undefined ? { parentSpanId: span.parentSpanId } : {},
	...span.context.traceState !== undefined ? { traceState: span.context.traceState } : {},
	name: span.name,
	kind: SPAN_KIND_CODES[span.kind],
	startTimeUnixNano: span.startTimeUnixNano.toString(),
	endTimeUnixNano: span.endTimeUnixNano.toString(),
	attributes: encodeAttributes(span.attributes),
	events: span.events.map(event => ({
		name: event.name,
		timeUnixNano: event.timeUnixNano.toString(),
		attributes: encodeAttributes(event.attributes),
	})),
	links: span.links.map(link => ({
		traceId: link.context.traceId,
		spanId: link.context.spanId,
		...link.context.traceState !== undefined ? { traceState: link.context.traceState } : {},
		attributes: encodeAttributes(link.attributes),
	})),
	...span.status.code === 'unset' ? {} : {
		status: {
			code: SPAN_STATUS_CODES[span.status.code],
			...span.status.message !== undefined ? { message: span.status.message } : {},
		},
	},
})

export const encodeSpans = (spans: readonly ReadableSpan[], resource: Resource): OtlpTracePayload => ({
	resourceSpans: [{
		resource: { attributes: encodeAttributes({ 'service.name': resource.serviceName, ...resource.attributes }) },
		scopeSpans: [{ scope: { name: SCOPE_NAME }, spans: spans.map(encodeSpan) }],
	}],
})
