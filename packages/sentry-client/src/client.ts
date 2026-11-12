import { randomUUID } from 'node:crypto'
import { hostname, release, type } from 'node:os'
import { dirname } from 'node:path'
import { addContextLines } from './contextLines.js'
import { authHeader, envelopeEndpoint, parseDsn } from './dsn.js'
import { buildException } from './event.js'
import { normalize, normalizeRecord, truncate } from './normalize.js'
import { createModuleResolver } from './stack.js'
import { createFetchTransport, Fetch, Transport, TransportLogger } from './transport.js'
import { Mechanism, Scope, SentryEvent, SeverityLevel } from './types.js'

export type BeforeSend = (event: SentryEvent) => SentryEvent | null | Promise<SentryEvent | null>

export interface SentryClientOptions {
	readonly dsn: string
	readonly release?: string
	/** Defaults to `production`, as the Sentry SDKs do. */
	readonly environment?: string
	/** Defaults to the host name. */
	readonly serverName?: string
	/** Reported as the SDK version, e.g. the version of the application. */
	readonly version?: string
	/** Last look at each event before it is sent: return it (changed or not), or `null` to drop it. */
	readonly beforeSend?: BeforeSend
	/** Lines of source around each frame; 0 turns it off. Default 7. */
	readonly contextLines?: number
	/** Diagnostics of the client itself, e.g. a failed delivery. Default: `console.warn`. */
	readonly logger?: TransportLogger
	readonly fetch?: Fetch
	/** Per delivery. Default 5 s. */
	readonly timeoutMs?: number
	/** Events delivered at the same time; more are dropped. Default 30. */
	readonly maxInFlight?: number
}

export interface CaptureOptions {
	/** How the error was caught; default `{ type: 'generic', handled: true }`. */
	readonly mechanism?: Pick<Mechanism, 'type' | 'handled'>
}

export interface SentryClient {
	/** Reports `error` (an Error or any value) and returns the event id, or `undefined` when it is not sent. */
	captureException(error: unknown, scope?: Scope, options?: CaptureOptions): string | undefined
	/** Reports a message, e.g. a `console.error` call. */
	captureMessage(message: string, scope?: Scope): string | undefined
	/** Waits for events being prepared and delivered; `false` when `timeoutMs` ran out first. */
	flush(timeoutMs: number): Promise<boolean>
	/** Flushes, then ignores further captures. */
	close(timeoutMs: number): Promise<boolean>
}

const sdkName = 'contember.sentry-client'
const normalizeDepth = 3
const normalizeBreadth = 1000
const maxValueLength = 250

const withoutUndefined = (record: Readonly<Record<string, string | undefined>>): Record<string, string> =>
	Object.fromEntries(Object.entries(record).flatMap(([key, value]) => value === undefined ? [] : [[key, value]]))

export const createSentryClient = (options: SentryClientOptions): SentryClient => {
	const dsn = parseDsn(options.dsn)
	const sdk = { name: sdkName, version: options.version ?? 'unknown' }
	const logger = options.logger ?? ((message: string) => console.warn(message))
	const transport: Transport = createFetchTransport({
		url: envelopeEndpoint(dsn),
		auth: authHeader(dsn, `${sdk.name}/${sdk.version}`),
		fetch: options.fetch ?? fetch,
		logger,
		timeoutMs: options.timeoutMs ?? 5000,
		maxInFlight: options.maxInFlight ?? 30,
	})
	const contextLines = options.contextLines ?? 7
	const resolveModule = createModuleResolver(process.argv[1] ? dirname(process.argv[1]) : process.cwd())
	const baseContexts = {
		runtime: { name: 'node', version: process.version },
		os: { name: type(), kernel_version: release() },
		app: { app_start_time: new Date(Date.now() - process.uptime() * 1000).toISOString() },
	}
	// the same error object is reported once, even when it is logged on several levels
	const captured = new WeakSet<object>()
	const preparing = new Set<Promise<void>>()
	let closed = false

	const baseEvent = (level: SeverityLevel, scope: Scope): SentryEvent => ({
		event_id: randomUUID().replaceAll('-', ''),
		timestamp: Date.now() / 1000,
		platform: 'node',
		level: scope.level ?? level,
		server_name: options.serverName ?? hostname(),
		environment: options.environment ?? 'production',
		...(options.release !== undefined ? { release: options.release } : {}),
		...(scope.tags ? { tags: withoutUndefined(scope.tags) } : {}),
		...(scope.user ? { user: normalizeRecord(scope.user, normalizeDepth, normalizeBreadth) } : {}),
		...(scope.extra ? { extra: normalizeRecord(scope.extra, normalizeDepth, normalizeBreadth) } : {}),
		...(scope.request
			? {
				request: {
					...scope.request,
					...(scope.request.url !== undefined ? { url: truncate(scope.request.url, maxValueLength) } : {}),
					// not cut at depth 3, as before: it is the request body, whose nesting is what one debugs
					...(scope.request.data !== undefined ? { data: normalize(scope.request.data, 100, normalizeBreadth) } : {}),
				},
			}
			: {}),
		// each context one level down, as when the whole `contexts` object was normalized to depth 3
		contexts: Object.fromEntries(
			Object.entries({ ...baseContexts, ...scope.contexts }).map(([key, value]) => [key, normalizeRecord(value, normalizeDepth - 1, normalizeBreadth)]),
		),
		sdk,
	})

	const deliver = async (event: SentryEvent): Promise<void> => {
		for (const value of event.exception?.values ?? []) {
			await addContextLines(value.stacktrace?.frames ?? [], contextLines)
		}
		let final: SentryEvent | null = event
		if (options.beforeSend) {
			try {
				final = await options.beforeSend(event)
			} catch (error) {
				logger(`Sentry: beforeSend failed, the event was dropped: ${error instanceof Error ? error.message : String(error)}`)
				return
			}
		}
		if (final === null) {
			return
		}
		const header = { event_id: final.event_id, sent_at: new Date().toISOString(), sdk }
		transport.send(`${JSON.stringify(header)}\n${JSON.stringify({ type: 'event' })}\n${JSON.stringify(final)}`, 'error')
	}

	const enqueue = (event: SentryEvent): string => {
		const preparation = deliver(event)
			.catch(error => logger(`Sentry: could not prepare an event: ${error instanceof Error ? error.message : String(error)}`))
			.finally(() => preparing.delete(preparation))
		preparing.add(preparation)
		return event.event_id
	}

	const flush = async (timeoutMs: number): Promise<boolean> => {
		const deadline = Date.now() + timeoutMs
		let timer: ReturnType<typeof setTimeout> | undefined
		const timeout = new Promise<false>(resolve => {
			timer = setTimeout(() => resolve(false), timeoutMs)
		})
		try {
			const prepared = await Promise.race([Promise.all(preparing).then(() => true), timeout])
			return prepared && await transport.flush(Math.max(deadline - Date.now(), 0))
		} finally {
			clearTimeout(timer)
		}
	}

	return {
		captureException(error, scope = {}, { mechanism = { type: 'generic', handled: true } } = {}) {
			if (closed || (typeof error === 'object' && error !== null && captured.has(error))) {
				return undefined
			}
			if (typeof error === 'object' && error !== null) {
				captured.add(error)
			}
			const exception = buildException(error, new Error('Sentry syntheticException'), mechanism, resolveModule, normalizeDepth, normalizeBreadth)
			// normalized with the rest of `extra`, so it is cut one level deeper than the value itself, as before
			const extra = exception.serialized !== undefined ? { ...scope.extra, __serialized__: exception.serialized } : scope.extra
			return enqueue({ ...baseEvent('error', { ...scope, extra }), exception: { values: exception.values } })
		},
		captureMessage(message, scope = {}) {
			if (closed) {
				return undefined
			}
			return enqueue({ ...baseEvent('info', scope), message: truncate(message, maxValueLength) })
		},
		flush,
		async close(timeoutMs) {
			const result = await flush(timeoutMs)
			closed = true
			return result
		},
	}
}
