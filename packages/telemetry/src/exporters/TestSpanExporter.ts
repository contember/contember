import { ReadableSpan, SpanExporter } from '../types.js'

export class TestSpanExporter implements SpanExporter {
	public readonly spans: ReadableSpan[] = []

	constructor(
		private print = false,
	) {
	}

	async export(spans: readonly ReadableSpan[]): Promise<void> {
		this.spans.push(...spans)
		if (this.print) {
			for (const span of spans) {
				console.error(span.name)
			}
		}
	}

	async shutdown(): Promise<void> {
	}
}
