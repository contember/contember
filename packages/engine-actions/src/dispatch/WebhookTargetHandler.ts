import { Actions, ActionsPayload } from '@contember/schema'
import { EventRow, HandledEvent, InvokeHandler, InvokeHandlerArgs } from './types.js'
import { VariablesMap } from '../model/VariablesManager.js'
import * as Typesafe from '@contember/typesafe'
import { FetcherResponse, WebhookFetcher } from './WebhookFetcher.js'
import { Logger } from '@contember/logger'
import { formatTraceparent, INVALID_TRACE_ID, Tracer } from '@contember/telemetry'

const DEFAULT_TIMEOUT_MS = 30_000 // 30 seconds

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

		const start = process.hrtime.bigint()
		const getDuration = () => Math.floor(Number((process.hrtime.bigint() - start) / BigInt(1_000_000)))

		let eventResponseFactory: EventResponseFactory
		try {
			// The target is identified by name only: its URL and headers may carry credentials.
			const response = await this.tracer.span('webhook', async span => {
				const response = await this.fetch(timeoutMs ?? DEFAULT_TIMEOUT_MS, target, variables, events)
				span.setAttribute('http.response.status_code', response.status)
				return response
			}, {
				kind: 'client',
				attributes: {
					'contember.actions.target': target.name,
					'contember.actions.events': events.length,
				},
			})

			eventResponseFactory = this.createResponseFactory({
				response: response,
				events,
				target,
				logger,
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

	private createResponseFactory({ response, events, target, logger }: {
		response: FetcherResponse
		events: EventRow[]
		target: Actions.WebhookTarget
		logger: Logger
	}): EventResponseFactory {
		if (!response.ok) {
			// The target is identified by name only: its URL and headers may carry credentials.
			logger.warn('Webhook target responded with an error status', {
				target: target.name,
				status: response.status,
				statusText: response.statusText,
				events: events.map(it => it.id),
			})
			return () => ({
				ok: false,
				code: response.status,
				response: response.responseText,
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
					response: response.responseText,
					errorMessage: 'Invalid response: undefined events IDs: ' + missingEvents.join('; '),
				})
			}

			const failedIds = events.filter(it => failedEvents[it.id]).map(it => it.id)
			if (failedIds.length) {
				// Per-event errors come from the target's payload and stay in the event log, not here.
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
			// The parser message quotes the offending payload, so it stays in the event log only.
			logger.warn('Webhook target returned a malformed response', {
				target: target.name,
				status: response.status,
				events: events.map(it => it.id),
			})
			return () => ({
				ok: false,
				code: response.status,
				response: response.responseText,
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

	private async fetch(timeoutMs: number, target: Actions.WebhookTarget, variables: VariablesMap, events: EventRow[]): Promise<FetcherResponse> {
		return await withTimeout(timeoutMs, async abortController => {
			return await this.doFetch(target, variables, abortController, events)
		})
	}

	private async doFetch(
		target: Actions.WebhookTarget,
		variables: VariablesMap,
		abortController: AbortController,
		events: EventRow[],
	): Promise<FetcherResponse> {
		const resolvedUrl = this.resolveVariables(target.url, variables)
		const resolvedHeaders = Object.fromEntries(
			Object.entries(target.headers ?? {})
				.map(([key, value]) => [key, this.resolveVariables(value, variables)]),
		)

		return await this.fetcher.fetch(resolvedUrl, {
			method: 'POST',
			headers: {
				['User-Agent']: 'Contember Actions',
				...this.createTraceHeaders(resolvedHeaders),
				...resolvedHeaders,
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

	private resolveVariables(subject: string, variables: VariablesMap) {
		return subject.replace(/\{\{([\w_]+)}}/gm, (_, name) => {
			if (!variables[name]) {
				throw new Error(`Undefined variable ${name}`)
			}
			return variables[name]
		})
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
