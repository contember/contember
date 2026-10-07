import { ReadableSpan, SpanExporter, SpanProcessor } from './types.js'

const ERROR_REPORT_INTERVAL_MS = 60_000

const normalizePositiveInteger = (value: number, fallback: number): number => Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback

export interface BatchSpanProcessorOptions {
	exporter: SpanExporter
	maxQueueSize?: number
	maxBatchSize?: number
	delayMs?: number
	/** How long shutdown may keep exporting before it drops the remaining spans, so termination stays within a grace period. */
	shutdownTimeoutMs?: number
	onError?: (error: unknown) => void
}

const settlesWithin = async (promise: Promise<void>, timeoutMs: number): Promise<boolean> => {
	let timer: ReturnType<typeof setTimeout> | undefined
	try {
		return await Promise.race([
			promise.then(() => true),
			new Promise<boolean>(resolve => {
				timer = setTimeout(() => resolve(false), timeoutMs)
			}),
		])
	} finally {
		clearTimeout(timer)
	}
}

export const createBatchSpanProcessor = (
	{
		exporter,
		maxQueueSize: configuredMaxQueueSize = 2048,
		maxBatchSize: configuredMaxBatchSize = 512,
		delayMs: configuredDelayMs = 5000,
		shutdownTimeoutMs: configuredShutdownTimeoutMs = 5000,
		onError,
	}: BatchSpanProcessorOptions,
): SpanProcessor => {
	const maxQueueSize = normalizePositiveInteger(configuredMaxQueueSize, 2048)
	const maxBatchSize = normalizePositiveInteger(configuredMaxBatchSize, 512)
	const delayMs = normalizePositiveInteger(configuredDelayMs, 5000)
	const shutdownTimeoutMs = normalizePositiveInteger(configuredShutdownTimeoutMs, 5000)
	const queue: ReadableSpan[] = []
	let exportingSpanCount = 0
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
			exportingSpanCount = batch.length
			try {
				await exporter.export(batch)
			} catch (error) {
				reportError(() => error)
			} finally {
				exportingSpanCount = 0
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
				const closeExporter = async () => {
					await flushAll()
					try {
						await exporter.shutdown()
					} catch (error) {
						reportError(() => error)
					}
				}
				if (!(await settlesWithin(closeExporter(), shutdownTimeoutMs))) {
					const droppedOnShutdown = queue.length + exportingSpanCount
					queue.length = 0
					// Reported directly: the rate limit must not hide the final data loss.
					onError?.(new Error(`Telemetry shutdown timed out after ${shutdownTimeoutMs} ms, dropped ${droppedOnShutdown} spans.`))
				}
			})()
			return shutdownPromise
		},
	}
}
