import { ReadableSpan, SpanProcessor } from '@contember/telemetry'

export interface FilteringSpanProcessorOptions {
	inner: SpanProcessor
	shouldDrop: (span: ReadableSpan) => boolean
}

export const createFilteringSpanProcessor = ({ inner, shouldDrop }: FilteringSpanProcessorOptions): SpanProcessor => ({
	onEnd: span => {
		if (!shouldDrop(span)) {
			inner.onEnd(span)
		}
	},
	forceFlush: () => inner.forceFlush(),
	shutdown: () => inner.shutdown(),
})

export const createFastSqlSpanFilter = (minDurationMs: number) => (span: ReadableSpan): boolean =>
	span.kind === 'client'
	&& span.attributes['db.system'] !== undefined
	&& span.status.code !== 'error'
	&& Number(span.endTimeUnixNano - span.startTimeUnixNano) < minDurationMs * 1e6
