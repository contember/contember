import { expect, test } from 'bun:test'
import { noopTracer } from '@contember/telemetry'
import { TelemetryConfig } from '../../../src/config/config.js'
import { serverConfigSchema } from '../../../src/config/configSchema.js'
import { createDefaultLogger } from '../../../src/utils/serverStartup.js'
import { createTelemetry, parseOtlpHeaders, resolveOtlpEndpoint, resolveOtlpHeaders } from '../../../src/telemetry/TelemetryFactory.js'
import { createObjectParametersResolver, resolveParameters } from '@contember/config-loader'
import { configTemplate } from '../../../src/config/configTemplate.js'

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

test('telemetry: full configuration through CONTEMBER_TELEMETRY_* environment variables', () => {
	const env = {
		CONTEMBER_TELEMETRY_TRACES_ENABLED: 'true',
		CONTEMBER_TELEMETRY_OTLP_ENDPOINT: 'http://collector:4318',
		CONTEMBER_TELEMETRY_SAMPLER: 'ratio',
		CONTEMBER_TELEMETRY_SAMPLER_RATIO: '0.25',
		CONTEMBER_TELEMETRY_ACCEPT_INCOMING: 'all',
		CONTEMBER_TELEMETRY_PROPAGATE_TO_WEBHOOKS: 'false',
		CONTEMBER_TELEMETRY_SQL_INCLUDE_QUERY_TEXT: 'true',
		CONTEMBER_TELEMETRY_SQL_MIN_DURATION_MS: '5',
	}
	const resolved = resolveParameters(configTemplate.server, createObjectParametersResolver({ env }))
	const telemetry = serverConfigSchema(resolved).telemetry
	expect(telemetry?.traces?.enabled).toBe(true)
	expect(telemetry?.traces?.exporter?.endpoint).toBe('http://collector:4318')
	expect(telemetry?.traces?.sampler).toBe('ratio')
	expect(telemetry?.traces?.samplerRatio).toBe(0.25)
	expect(telemetry?.traces?.acceptIncoming).toBe('all')
	expect(telemetry?.traces?.propagateToWebhooks).toBe(false)
	expect(telemetry?.traces?.sql?.includeQueryText).toBe(true)
	expect(telemetry?.traces?.sql?.minDurationMs).toBe(5)
})

test('telemetry: template with no telemetry env variables resolves to disabled tracing', () => {
	const resolved = resolveParameters(configTemplate.server, createObjectParametersResolver({ env: {} }))
	const serverConfig = serverConfigSchema(resolved)
	expect(serverConfig.telemetry?.traces?.enabled).toBeUndefined()
	expect(createTelemetry({ config: serverConfig.telemetry, logger: createDefaultLogger(), env: {} }).tracer).toBe(noopTracer)
})

test('telemetry: invalid enum value from environment fails validation', () => {
	const env = { CONTEMBER_TELEMETRY_SAMPLER: 'sometimes' }
	const resolved = resolveParameters(configTemplate.server, createObjectParametersResolver({ env }))
	expect(() => serverConfigSchema(resolved)).toThrow()
})

test('otlp headers: parses comma-separated key=value pairs with encoding and spaces', () => {
	expect(parseOtlpHeaders('authorization=Bearer%20abc, x-tenant=main')).toStrictEqual({
		authorization: 'Bearer abc',
		'x-tenant': 'main',
	})
})

test('otlp headers: malformed entry is rejected', () => {
	expect(() => parseOtlpHeaders('no-equals-sign')).toThrow()
})

test('otlp headers: configured headers win over both env variables', () => {
	expect(resolveOtlpHeaders({ authorization: 'configured' }, {
		OTEL_EXPORTER_OTLP_TRACES_HEADERS: 'authorization=traces',
		OTEL_EXPORTER_OTLP_HEADERS: 'authorization=generic',
	})).toStrictEqual({ authorization: 'configured' })
})

test('otlp headers: signal-specific env variable wins over the generic one', () => {
	expect(resolveOtlpHeaders(undefined, {
		OTEL_EXPORTER_OTLP_TRACES_HEADERS: 'authorization=traces',
		OTEL_EXPORTER_OTLP_HEADERS: 'authorization=generic',
	})).toStrictEqual({ authorization: 'traces' })
	expect(resolveOtlpHeaders(undefined, { OTEL_EXPORTER_OTLP_HEADERS: 'authorization=generic' }))
		.toStrictEqual({ authorization: 'generic' })
	expect(resolveOtlpHeaders(undefined, {})).toStrictEqual({})
})
