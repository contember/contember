import { ReadableSpan, SpanExporter } from '../types.js'

export class ConsoleSpanExporter implements SpanExporter {
	async export(spans: readonly ReadableSpan[]): Promise<void> {
		for (const span of spans) {
			const durationMs = Number(span.endTimeUnixNano - span.startTimeUnixNano) / 1e6
			const parent = span.parentSpanId ?? 'root'
			console.info(`[trace ${span.context.traceId}] ${span.context.spanId} < ${parent} ${span.name} ${durationMs.toFixed(2)}ms ${span.status.code}`)
		}
	}

	async shutdown(): Promise<void> {
	}
}
