import { expect, test } from 'bun:test'
import { noopTracer } from '@contember/telemetry'
import { TelemetryConfig } from '../../../src/config/config.js'
import { serverConfigSchema } from '../../../src/config/configSchema.js'
import { createDefaultLogger } from '../../../src/utils/serverStartup.js'
import { createTelemetry, resolveOtlpEndpoint } from '../../../src/telemetry/TelemetryFactory.js'

test('telemetry: absent section parses to undefined', () => {
	expect(serverConfigSchema({}).telemetry).toBeUndefined()
})

test('telemetry: minimal block parses', () => {
	expect(serverConfigSchema({ telemetry: { traces: { enabled: true } } }).telemetry).toStrictEqual({ traces: { enabled: true } })
})

test('telemetry: full block parses', () => {
	const telemetry: TelemetryConfig = {
		resource: {
			serviceName: 'contember-engine',
			attributes: { 'deployment.environment': 'production' },
		},
		traces: {
			enabled: true,
			exporter: {
				type: 'otlp-http',
				endpoint: 'http://collector:4318',
				headers: { authorization: 'Bearer token' },
				timeoutMs: 10000,
			},
			sampler: 'parentRatio',
			samplerRatio: 1,
			acceptIncoming: 'trusted-proxies',
			traceIdResponseHeader: false,
			maxSpansPerRequest: 1000,
			sql: { enabled: true, includeQueryText: true, minDurationMs: 0 },
			batch: { maxQueueSize: 2048, maxBatchSize: 512, delayMs: 5000 },
		},
	}
	expect(serverConfigSchema({ telemetry }).telemetry).toStrictEqual(telemetry)
})

test('telemetry: unknown exporter type is rejected', () => {
	expect(() => serverConfigSchema({ telemetry: { traces: { exporter: { type: 'otlp-grpc' } } } })).toThrow()
})

test('telemetry: unknown sampler is rejected', () => {
	expect(() => serverConfigSchema({ telemetry: { traces: { sampler: 'sometimes' } } })).toThrow()
})

test('telemetry: unknown acceptIncoming mode is rejected', () => {
	expect(() => serverConfigSchema({ telemetry: { traces: { acceptIncoming: 'maybe' } } })).toThrow()
})

test('telemetry: non-boolean enabled is rejected', () => {
	expect(() => serverConfigSchema({ telemetry: { traces: { enabled: 'yes' } } })).toThrow()
})

test('otlp endpoint: explicit config wins over both env variables', () => {
	expect(resolveOtlpEndpoint('http://configured:4318', {
		OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: 'http://traces:4318',
		OTEL_EXPORTER_OTLP_ENDPOINT: 'http://generic:4318',
	})).toBe('http://configured:4318')
})

test('otlp endpoint: the traces-specific env variable wins over the generic one', () => {
	expect(resolveOtlpEndpoint(undefined, {
		OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: 'http://traces:4318',
		OTEL_EXPORTER_OTLP_ENDPOINT: 'http://generic:4318',
	})).toBe('http://traces:4318')
})

test('otlp endpoint: falls back to the generic env variable', () => {
	expect(resolveOtlpEndpoint(undefined, { OTEL_EXPORTER_OTLP_ENDPOINT: 'http://generic:4318' })).toBe('http://generic:4318')
})

test('otlp endpoint: missing everywhere is rejected with a clear message', () => {
	expect(() => resolveOtlpEndpoint(undefined, {})).toThrow(/OTEL_EXPORTER_OTLP_TRACES_ENDPOINT/)
})

test('telemetry factory: disabled config yields the no-op tracer and no processor', () => {
	const telemetry = createTelemetry({ config: undefined, logger: createDefaultLogger(), env: {} })
	expect(telemetry.tracer).toBe(noopTracer)
	expect(telemetry.processor).toBeUndefined()
})

test('telemetry factory: enabled otlp-http without an endpoint fails', () => {
	expect(() =>
		createTelemetry({
			config: { traces: { enabled: true } },
			logger: createDefaultLogger(),
			env: {},
		})
	).toThrow(/no endpoint is set/)
})

test('telemetry factory: enabled console exporter needs no endpoint', () => {
	const telemetry = createTelemetry({
		config: { traces: { enabled: true, exporter: { type: 'console' } } },
		logger: createDefaultLogger(),
		env: {},
	})
	expect(telemetry.tracer).not.toBe(noopTracer)
	expect(telemetry.processor).toBeDefined()
})
