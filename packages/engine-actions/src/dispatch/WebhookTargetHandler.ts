import { Actions, ActionsPayload } from '@contember/schema'
import { EventRow, HandledEvent, InvokeHandler, InvokeHandlerArgs } from './types'
import { VariablesMap } from '../model/VariablesManager'
import * as Typesafe from '@contember/typesafe'
import { FetcherResponse, WebhookFetcher } from './WebhookFetcher'
import { Logger } from '@contember/logger'
import { redactRequestError } from './redactRequestError'
import { truncateText } from './truncateText'

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

type ResolvedRequest = {
	url: string
	headers: Record<string, string>
	/** The resolved URL, header values and interpolated variable values, which a logged response body must not quote. */
	secrets: ReadonlySet<string>
}

export class WebhookTargetHandler implements InvokeHandler<Actions.WebhookTarget> {
	constructor(
		private readonly fetcher: WebhookFetcher,
	) {
	}

	public async handle({ target, events, logger, variables }: InvokeHandlerArgs<Actions.WebhookTarget>): Promise<HandledEvent[]> {
		const timeoutMs = target.timeoutMs

		const start = process.hrtime.bigint()
		const getDuration = () => Math.floor(Number((process.hrtime.bigint() - start) / BigInt(1_000_000)))

		let eventResponseFactory: EventResponseFactory
		try {
			const request = this.resolveRequest(target, variables)
			const response = await this.fetch(timeoutMs ?? DEFAULT_TIMEOUT_MS, target, request, events)

			eventResponseFactory = this.createResponseFactory({
				response: response,
				events,
				target,
				logger,
				secrets: request.secrets,
			})
		} catch (e) {
			logger.warn(e)
			const errorMessages = this.extractErrorMessages(e)
			const result = {
				ok: false,
				errorMessage: errorMessages.length ? errorMessages.join('; ') : undefined,
				durationMs: getDuration(),
			}
			eventResponseFactory = () => ({ ok: false, errorMessage: errorMessages.length ? errorMessages.join('; ') : undefined })

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
				...request.headers,
				['Content-type']: 'application/json',
			},
			signal: abortController.signal,
			body: this.formatBody(events, target),
		})
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

	private resolveRequest(target: Actions.WebhookTarget, variables: VariablesMap): ResolvedRequest {
		const secrets = new Set<string>()
		const resolve = (subject: string) =>
			subject.replace(/\{\{([\w_]+)}}/gm, (_, name) => {
				if (!variables[name]) {
					throw new Error(`Undefined variable ${name}`)
				}
				secrets.add(variables[name])
				return variables[name]
			})
		const url = resolve(target.url)
		const headers = Object.fromEntries(Object.entries(target.headers ?? {}).map(([key, value]) => [key, resolve(value)]))
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
