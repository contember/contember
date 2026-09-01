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
			headers: { ...traces.exporter?.headers },
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
