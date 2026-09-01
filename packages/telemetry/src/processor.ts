import { ReadableSpan, SpanExporter, SpanProcessor } from './types.js'

const ERROR_REPORT_INTERVAL_MS = 60_000

export interface BatchSpanProcessorOptions {
	exporter: SpanExporter
	maxQueueSize?: number
	maxBatchSize?: number
	delayMs?: number
	onError?: (error: unknown) => void
}

export const createBatchSpanProcessor = (
	{ exporter, maxQueueSize = 2048, maxBatchSize = 512, delayMs = 5000, onError }: BatchSpanProcessorOptions,
): SpanProcessor => {
	const queue: ReadableSpan[] = []
	let droppedSpanCount = 0
	let exporting: Promise<void> | undefined
	let shutdownPromise: Promise<void> | undefined
	let lastErrorReportedAt = Number.NEGATIVE_INFINITY

	const reportError = (createError: () => unknown): void => {
		const now = Date.now()
		if (onError === undefined || now - lastErrorReportedAt < ERROR_REPORT_INTERVAL_MS) {
			return
		}
		lastErrorReportedAt = now
		onError(createError())
	}

	const drain = async (): Promise<void> => {
		while (queue.length > 0) {
			const batch = queue.splice(0, maxBatchSize)
			try {
				await exporter.export(batch)
			} catch (error) {
				reportError(() => error)
			}
		}
	}

	const flush = (): Promise<void> => {
		exporting ??= drain().finally(() => {
			exporting = undefined
		})
		return exporting
	}

	const flushAll = async (): Promise<void> => {
		while (queue.length > 0 || exporting !== undefined) {
			await flush()
		}
	}

	const timer = setInterval(() => void flush(), delayMs)
	timer.unref()

	return {
		onEnd: span => {
			if (shutdownPromise !== undefined) {
				return
			}
			if (queue.length >= maxQueueSize) {
				queue.shift()
				droppedSpanCount++
				reportError(() => new Error(`Telemetry queue is full, dropped ${droppedSpanCount} spans.`))
			}
			queue.push(span)
			if (queue.length >= maxBatchSize) {
				void flush()
			}
		},
		forceFlush: flushAll,
		shutdown: () => {
			shutdownPromise ??= (async () => {
				clearInterval(timer)
				await flushAll()
				try {
					await exporter.shutdown()
				} catch (error) {
					reportError(() => error)
				}
			})()
			return shutdownPromise
		},
	}
}
