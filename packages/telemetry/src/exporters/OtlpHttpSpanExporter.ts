import { encodeSpans } from '../otlp.js'
import { ReadableSpan, Resource, SpanExporter } from '../types.js'

export interface OtlpHttpSpanExporterOptions {
	endpoint: string
	resource: Resource
	headers?: Record<string, string>
	timeoutMs?: number
}

export class OtlpHttpSpanExporter implements SpanExporter {
	private readonly url: string

	constructor(
		private readonly options: OtlpHttpSpanExporterOptions,
	) {
		const endpoint = options.endpoint.replace(/\/+$/, '')
		this.url = endpoint.endsWith('/v1/traces') ? endpoint : `${endpoint}/v1/traces`
	}

	async export(spans: readonly ReadableSpan[]): Promise<void> {
		if (spans.length === 0) {
			return
		}
		const response = await fetch(this.url, {
			method: 'POST',
			headers: { 'content-type': 'application/json', ...this.options.headers },
			body: JSON.stringify(encodeSpans(spans, this.options.resource)),
			signal: AbortSignal.timeout(this.options.timeoutMs ?? 10000),
		})
		const body = await response.text()
		if (!response.ok) {
			throw new Error(`OTLP trace export failed with status ${response.status}: ${body}`)
		}
	}

	async shutdown(): Promise<void> {
	}
}
