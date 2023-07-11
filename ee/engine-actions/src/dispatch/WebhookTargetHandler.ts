import { Actions } from '@contember/schema'
import { EventRow, HandledEvent, InvokeHandler, InvokeHandlerArgs, WebhookEvent, WebhookRequestPayload } from './types'
import { VariablesMap } from '../model/VariablesManager'
import * as Typesafe from '@contember/typesafe'
import { FetcherResponse, WebhookFetcher } from './WebhookFetcher'

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

type EventResponseFactory = (eventRow: EventRow) => ({ ok: boolean; code?: number; response?: string; errorMessage?: string; durationMs?: number })

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

			const response = await this.fetch(timeoutMs ?? DEFAULT_TIMEOUT_MS, target, variables, events)

			eventResponseFactory = this.createResponseFactory({
				response: response,
				events,
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

	private createResponseFactory({ response, events }: {
		response: FetcherResponse
		events: EventRow[]
	}): EventResponseFactory {
		if (!response.ok) {
			return () => ({
				ok: false,
				code: response.status,
				response: response.responseText,
				errorMessage: response.statusText,
			})
		}

		if (response.responseText.trim() === '') {
			return () => ({
				ok: true,
				code: response.status,
			})
		}

		try {
			const responseData = ResponseType(JSON.parse(response.responseText))
			const eventsInBatch = new Set(events.map(it => it.id))
			const failedEvents = Object.fromEntries(responseData.failures?.map(it => [it.eventId, it]) ?? [])
			const missingEvents =  Object.keys(failedEvents).filter(it => !eventsInBatch.has(it))

			if (missingEvents.length) {
				return () => ({
					ok: false,
					code: response.status,
					response: response.responseText,
					errorMessage: 'Invalid response: undefined events IDs: ' + missingEvents.join('; '),
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

	private async doFetch(target: Actions.WebhookTarget, variables: VariablesMap, abortController: AbortController, events: EventRow[]): Promise<FetcherResponse> {
		const resolvedUrl = this.resolveVariables(target.url, variables)
		const resolvedHeaders = Object.fromEntries(Object.entries(target.headers ?? {})
			.map(([key, value]) => [key, this.resolveVariables(value, variables)]))

		const payload: WebhookRequestPayload = {
			events: events.map(this.formatEventPayload),
		}

		return await this.fetcher.fetch(resolvedUrl, {
			method: 'POST',
			headers: {
				['User-Agent']: 'Contember Actions',
				...resolvedHeaders,
				['Content-type']: 'application/json',
			},
			signal: abortController.signal,
			body: JSON.stringify(payload),
		})
	}

	private formatEventPayload(it: EventRow): WebhookEvent {
		return {
			meta: {
				eventId: it.id,
				transactionId: it.transaction_id,
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
