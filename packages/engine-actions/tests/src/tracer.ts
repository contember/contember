import { alwaysSampler, createBatchSpanProcessor, createTracer, TestSpanExporter, Tracer } from '@contember/telemetry'

export const createRecordingTracer = (): { exporter: TestSpanExporter; tracer: Tracer; flush: () => Promise<void> } => {
	const exporter = new TestSpanExporter()
	const processor = createBatchSpanProcessor({ exporter, delayMs: 60_000 })
	return {
		exporter,
		tracer: createTracer({ sampler: alwaysSampler(), processor }),
		flush: () => processor.forceFlush(),
	}
}
