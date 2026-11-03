import { Actions, ActionsPayload } from '@contember/schema'
import { EventRow, HandledEvent, InvokeHandler, InvokeHandlerArgs } from './types.js'
import { resolveVariable, VariablesMap } from '../model/VariablesManager.js'
import * as Typesafe from '@contember/typesafe'
import { FetcherResponse, WebhookFetcher } from './WebhookFetcher.js'
import { Logger } from '@contember/logger'
import { formatTraceparent, INVALID_TRACE_ID, Tracer } from '@contember/telemetry'
import { replaceActionsVariables } from '@contember/schema-utils'
import { redactRequestError } from './redactRequestError.js'
import { truncateText } from './truncateText.js'

const DEFAULT_TIMEOUT_MS = 30_000 // 30 seconds
const LOGGED_RESPONSE_MAX_LENGTH = 500
// keeps an HTML error page from bloating actions_event.log, which gains one attempt per retry
const STORED_RESPONSE_MAX_LENGTH = 4_096

const ResponseType = Typesafe.noExtraProps(Typesafe.object({
	failures: Typesafe.array(
		Typesafe.intersection(
			Typesafe.object({
				eventId: Typesafe.string,
			}),
			Typesafe.partial({
				error: Typesafe.string,
			}),
		),
	),
}))

type EventResponseFactory = (eventRow: EventRow) => { ok: boolean; code?: number; response?: string; errorMessage?: string; durationMs?: number }

/** Carries the name and code of a failed request, and a reason only when it was redacted. Never the cause, which may quote credentials. */
class WebhookRequestError extends Error {
	public readonly code?: string | number

	constructor(error: unknown, redactedReason?: string) {
		super(redactedReason === undefined ? 'Webhook request failed' : `Webhook request failed: ${redactedReason}`)
		try {
			if (error instanceof Error) {
				this.name = error.name
			}
		} catch {
		}
		const seen = new Set<object>()
		let current = error
		while (typeof current === 'object' && current !== null && !seen.has(current)) {
			seen.add(current)
			try {
				const code = 'code' in current ? current.code : undefined
				if (typeof code === 'string' || typeof code === 'number') {
					this.code = code
					break
				}
				current = 'cause' in current ? current.cause : undefined
			} catch {
				break
			}
		}
	}
}

/** The target interpolates a variable that has no value, so no request was made. */
export class UndefinedVariableError extends Error {
	constructor(public readonly variables: readonly string[]) {
		super(`Undefined variable ${variables.join(', ')}`)
	}
}

type ResolvedRequest = {
	url: string
	headers: Record<string, string>
	/** The resolved URL, header values and interpolated variable values, which an error message must not quote. */
	secrets: ReadonlySet<string>
}

export type WebhookTargetHandlerOptions = {
	propagateToWebhooks: boolean
}

export class WebhookTargetHandler implements InvokeHandler<Actions.WebhookTarget> {
	constructor(
		private readonly fetcher: WebhookFetcher,
		private readonly tracer: Tracer,
		private readonly options: WebhookTargetHandlerOptions,
	) {
	}

	public async handle({ target, events, logger, variables }: InvokeHandlerArgs<Actions.WebhookTarget>): Promise<HandledEvent[]> {
		const timeoutMs = target.timeoutMs
		// Outside the try below: an undefined variable is no failed delivery, the dispatcher holds the target back instead.
		const request = this.resolveVariables(target, variables)

		const start = process.hrtime.bigint()
		const getDuration = () => Math.floor(Number((process.hrtime.bigint() - start) / BigInt(1_000_000)))

		let eventResponseFactory: EventResponseFactory
		try {
			// The target is identified by name only: its URL and headers may carry credentials.
			const span = this.tracer.startSpan('webhook', {
				kind: 'client',
				attributes: {
					'contember.actions.target': target.name,
					'contember.actions.events': events.length,
				},
			})
			const response = await this.tracer.withSpan(span, async () => {
				try {
					const response = await this.fetch(timeoutMs ?? DEFAULT_TIMEOUT_MS, target, request, events)
					span.setAttribute('http.response.status_code', response.status)
					if (!response.ok) {
						span.setStatus('error')
					}
					return response
				} catch (error) {
					span.recordException(new WebhookRequestError(error))
					span.setStatus('error', 'Webhook request failed')
					throw error
				} finally {
					span.end()
				}
			})

			eventResponseFactory = this.createResponseFactory({
				response: response,
				events,
				target,
				logger,
				secrets: request.secrets,
			})
		} catch (e) {
			// Request errors may quote the resolved URL or a header value, so only a redacted reason is logged and stored.
			const errorMessages = this.extractErrorMessages(e).map(it => redactRequestError(it, request.secrets))
			const errorMessage = errorMessages.length ? errorMessages.join('; ') : undefined
			logger.warn(new WebhookRequestError(e, errorMessage), { target: target.name })
			const result = {
				ok: false,
				errorMessage,
				durationMs: getDuration(),
			}

			return events.map(it => ({ target, row: it, result }))
		}
		const durationMs = getDuration()

		return events.map(it => ({ target, row: it, result: { durationMs, ...eventResponseFactory(it) } }))
	}

	private createResponseFactory({ response, events, target, logger, secrets }: {
		response: FetcherResponse
		events: EventRow[]
		target: Actions.WebhookTarget
		logger: Logger
		secrets: ReadonlySet<string>
	}): EventResponseFactory {
		const storedResponse = truncateText(response.responseText, STORED_RESPONSE_MAX_LENGTH)
		if (!response.ok) {
			// The target is identified by name only: its URL and headers may carry credentials.
			// The one target payload that is logged: the error body, redacted (it may echo the request) and then cut short.
			logger.warn('Webhook target responded with an error status', {
				target: target.name,
				status: response.status,
				statusText: response.statusText,
				response: truncateText(redactRequestError(response.responseText, secrets), LOGGED_RESPONSE_MAX_LENGTH),
				events: events.map(it => it.id),
			})
			return () => ({
				ok: false,
				code: response.status,
				response: storedResponse,
				errorMessage: response.statusText,
			})
		}

		if (
			response.responseText.trim() === ''
			|| !response.headers.get('content-type')?.toLowerCase().includes('json')
		) {
			return () => ({
				ok: true,
				code: response.status,
			})
		}

		try {
			const parsedJson = JSON.parse(response.responseText)
			if (parsedJson === null || typeof parsedJson !== 'object' || !('failures' in parsedJson)) {
				return () => ({
					ok: true,
					code: response.status,
				})
			}
			const responseData = ResponseType(parsedJson)
			const eventsInBatch = new Set(events.map(it => it.id))
			const failedEvents = Object.fromEntries(responseData.failures?.map(it => [it.eventId, it]) ?? [])
			const missingEvents = Object.keys(failedEvents).filter(it => !eventsInBatch.has(it))

			if (missingEvents.length) {
				// Only the count of unknown ids: they are strings the target chose, not ours.
				logger.warn('Webhook target reported failures for event ids outside the batch', {
					target: target.name,
					status: response.status,
					unknownEventIds: missingEvents.length,
					events: events.map(it => it.id),
				})
				return () => ({
					ok: false,
					code: response.status,
					response: storedResponse,
					errorMessage: 'Invalid response: undefined events IDs: ' + missingEvents.join('; '),
				})
			}

			const failedIds = events.filter(it => failedEvents[it.id]).map(it => it.id)
			if (failedIds.length) {
				// Per-event errors come from a 2xx payload, which stays in the event log; only an error-status body is logged.
				logger.warn('Webhook target reported failed events', {
					target: target.name,
					status: response.status,
					events: failedIds,
				})
			}

			return it => {
				if (!failedEvents[it.id]) {
					return { ok: true, code: response.status }
				}
				return {
					ok: false,
					code: response.status,
					errorMessage: failedEvents[it.id].error,
				}
			}
		} catch (e: any) {
			// The parser message quotes a 2xx payload, so it stays in the event log; only an error-status body is logged.
			logger.warn('Webhook target returned a malformed response', {
				target: target.name,
				status: response.status,
				events: events.map(it => it.id),
			})
			return () => ({
				ok: false,
				code: response.status,
				response: storedResponse,
				errorMessage: 'Invalid response: ' + e.message,
			})
		}
	}

	private extractErrorMessages(e: unknown): string[] {
		const errorMessages = []
		let err = e
		while (typeof err === 'object' && err !== null && 'message' in err && typeof (err as any).message === 'string') {
			errorMessages.push((err as any).message)
			err = (err as any).cause
		}
		return errorMessages
	}

	private async fetch(timeoutMs: number, target: Actions.WebhookTarget, request: ResolvedRequest, events: EventRow[]): Promise<FetcherResponse> {
		return await withTimeout(timeoutMs, async abortController => {
			return await this.doFetch(target, request, abortController, events)
		})
	}

	private async doFetch(
		target: Actions.WebhookTarget,
		request: ResolvedRequest,
		abortController: AbortController,
		events: EventRow[],
	): Promise<FetcherResponse> {
		return await this.fetcher.fetch(request.url, {
			method: 'POST',
			headers: {
				['User-Agent']: 'Contember Actions',
				...this.createTraceHeaders(request.headers),
				...request.headers,
				['Content-type']: 'application/json',
			},
			signal: abortController.signal,
			body: this.formatBody(events, target),
		})
	}

	private createTraceHeaders(resolvedHeaders: Record<string, string>): Record<string, string> {
		if (this.options.propagateToWebhooks === false) {
			return {}
		}
		const activeContext = this.tracer.activeSpanContext()
		if (activeContext === undefined || activeContext.traceId === INVALID_TRACE_ID) {
			return {}
		}
		// A target-configured header wins, in whatever case it was written.
		if (Object.keys(resolvedHeaders).some(it => it.toLowerCase() === 'traceparent')) {
			return {}
		}
		const traceState = activeContext.traceState
		return {
			traceparent: formatTraceparent(activeContext),
			...(traceState !== undefined ? { tracestate: traceState } : {}),
		}
	}

	private formatBody(events: EventRow[], target: Actions.WebhookTarget): string {
		const body = target.body ?? {}
		const path = target.payloadPath ?? []
		let current: any = body
		for (let i = 0; i < path.length; i++) {
			current[path[i]] ??= {}
			current = current[path[i]]
		}
		current['events'] = events.map(this.formatEventPayload)
		return JSON.stringify(body)
	}

	private formatEventPayload(it: EventRow): ActionsPayload.WebhookEvent {
		return {
			meta: {
				eventId: it.id,
				transactionId: it.transaction_id,
				identityId: it.identity_id ?? null,
				ipAddress: it.ip_address ?? null,
				userAgent: it.user_agent ?? null,
				createdAt: it.created_at.toISOString(),
				lastStateChange: it.last_state_change.toISOString(),
				numRetries: it.num_retries,
				trigger: it.trigger,
				target: it.target,
				// todo: add stage and schema version
			},
			...it.payload,
		}
	}

	/** Throws {@link UndefinedVariableError} naming every variable without a value, an empty one included. */
	private resolveVariables(target: Actions.WebhookTarget, variables: VariablesMap): ResolvedRequest {
		const undefinedVariables = new Set<string>()
		const secrets = new Set<string>()
		const resolve = (subject: string) =>
			replaceActionsVariables(subject, name => {
				const value = resolveVariable(variables, name)
				if (value === undefined) {
					undefinedVariables.add(name)
					return ''
				}
				secrets.add(value)
				return value
			})
		const url = resolve(target.url)
		const headers = Object.fromEntries(Object.entries(target.headers ?? {}).map(([key, value]) => [key, resolve(value)]))
		if (undefinedVariables.size > 0) {
			throw new UndefinedVariableError([...undefinedVariables])
		}
		secrets.add(url)
		for (const value of Object.values(headers)) {
			secrets.add(value)
		}
		return { url, headers, secrets }
	}
}

const withTimeout = async <T>(timeoutMs: number, cb: (abortController: AbortController) => Promise<T>): Promise<T> => {
	const abortController = new AbortController()
	const timeoutId = setTimeout(() => {
		abortController.abort()
	}, timeoutMs)
	try {
		return await cb(abortController)
	} finally {
		clearTimeout(timeoutId)
	}
}
