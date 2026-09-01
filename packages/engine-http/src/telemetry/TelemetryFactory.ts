import { Logger } from '@contember/logger'
import {
	alwaysSampler,
	ConsoleSpanExporter,
	createBatchSpanProcessor,
	createTracer,
	neverSampler,
	noopTracer,
	OtlpHttpSpanExporter,
	parentRatioSampler,
	ratioSampler,
	Resource,
	Sampler,
	SpanExporter,
	SpanProcessor,
	Tracer,
} from '@contember/telemetry'
import { TelemetryConfig } from '../config/config.js'
import { createFastSqlSpanFilter, createFilteringSpanProcessor } from './FilteringSpanProcessor.js'

export interface Telemetry {
	tracer: Tracer
	/** Undefined when tracing is disabled; otherwise must be shut down on termination so pending spans are flushed. */
	processor?: SpanProcessor
}

export type TelemetryEnv = Record<string, string | undefined>

export const defaultServiceName = 'contember-engine'

export const parseOtlpHeaders = (raw: string): Record<string, string> => {
	const headers: Record<string, string> = {}
	for (const entry of raw.split(',')) {
		const trimmed = entry.trim()
		if (trimmed === '') {
			continue
		}
		const eq = trimmed.indexOf('=')
		if (eq <= 0) {
			throw new Error(`Invalid OTLP headers entry "${trimmed}", expected comma-separated key=value pairs.`)
		}
		headers[trimmed.slice(0, eq).trim()] = decodeURIComponent(trimmed.slice(eq + 1).trim())
	}
	return headers
}

export const resolveOtlpHeaders = (configured: Record<string, string> | undefined, env: TelemetryEnv): Record<string, string> => {
	if (configured !== undefined && Object.keys(configured).length > 0) {
		return { ...configured }
	}
	const raw = env.OTEL_EXPORTER_OTLP_TRACES_HEADERS || env.OTEL_EXPORTER_OTLP_HEADERS
	return raw ? parseOtlpHeaders(raw) : {}
}

export const resolveOtlpEndpoint = (configured: string | undefined, env: TelemetryEnv): string => {
	const endpoint = configured || env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || env.OTEL_EXPORTER_OTLP_ENDPOINT
	if (!endpoint) {
		throw new Error(
			'Telemetry traces are enabled with the otlp-http exporter, but no endpoint is set. '
				+ 'Configure telemetry.traces.exporter.endpoint, or set OTEL_EXPORTER_OTLP_TRACES_ENDPOINT or OTEL_EXPORTER_OTLP_ENDPOINT.',
		)
	}
	return endpoint
}

const createSampler = (type: 'always' | 'never' | 'ratio' | 'parentRatio', ratio: number): Sampler => {
	switch (type) {
		case 'always':
			return alwaysSampler()
		case 'never':
			return neverSampler()
		case 'ratio':
			return ratioSampler(ratio)
		case 'parentRatio':
			return parentRatioSampler(ratio)
	}
}

export const createTelemetry = (
	{ config, logger, env }: { config: TelemetryConfig | undefined; logger: Logger; env: TelemetryEnv },
): Telemetry => {
	const traces = config?.traces
	if (traces?.enabled !== true) {
		return { tracer: noopTracer }
	}
	const resource: Resource = {
		serviceName: config?.resource?.serviceName || env.OTEL_SERVICE_NAME || defaultServiceName,
		attributes: { ...config?.resource?.attributes },
	}
	const exporter: SpanExporter = (traces.exporter?.type ?? 'otlp-http') === 'console'
		? new ConsoleSpanExporter()
		: new OtlpHttpSpanExporter({
			endpoint: resolveOtlpEndpoint(traces.exporter?.endpoint, env),
			resource,
			headers: resolveOtlpHeaders(traces.exporter?.headers, env),
			timeoutMs: traces.exporter?.timeoutMs,
		})
	const batchProcessor = createBatchSpanProcessor({
		exporter,
		maxQueueSize: traces.batch?.maxQueueSize,
		maxBatchSize: traces.batch?.maxBatchSize,
		delayMs: traces.batch?.delayMs,
		onError: error => logger.warn(error, { module: 'telemetry' }),
	})
	const minDurationMs = traces.sql?.minDurationMs ?? 0
	const processor = minDurationMs > 0
		? createFilteringSpanProcessor({ inner: batchProcessor, shouldDrop: createFastSqlSpanFilter(minDurationMs) })
		: batchProcessor

	return {
		tracer: createTracer({
			sampler: createSampler(traces.sampler ?? 'parentRatio', traces.samplerRatio ?? 1),
			processor,
			maxSpansPerRecordingTrace: traces.maxSpansPerRequest,
		}),
		processor,
	}
}
