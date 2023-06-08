import { Actions } from '@contember/schema'
import { EventRow, HandledEvent, InvokeHandler, InvokeHandlerArgs, WebhookEvent, WebhookRequestPayload } from './types'
import { VariablesMap } from '../model/VariablesManager'

const DEFAULT_TIMEOUT_MS = 30_000 // 30 seconds

export class WebhookTargetHandler implements InvokeHandler<Actions.WebhookTarget> {
	public async handle({ target, events, logger, variables }: InvokeHandlerArgs<Actions.WebhookTarget>): Promise<HandledEvent[]> {
		const timeoutMs = target.timeoutMs

		const start = process.hrtime.bigint()
		const getDuration = () => Math.floor(Number((process.hrtime.bigint() - start) / BigInt(1_000_000)))
		try {

			const { response, text } = await this.fetch(timeoutMs ?? DEFAULT_TIMEOUT_MS, target, variables, events)

			const result = {
				ok: response.ok,
				code: response.status,
				durationMs: getDuration(),
				response: text,
				errorMessage: !response.ok ? response.statusText : undefined,
			}

			// todo: per-event response format

			return events.map(it => ({ target, row: it, result }))
		} catch (e) {
			logger.warn(e)
			const errorMessages = this.extractErrorMessages(e)
			const result = {
				ok: false,
				errorMessage: errorMessages.length ? errorMessages.join('; ') : undefined,
				durationMs: getDuration(),
			}
			return events.map(it => ({ target, row: it, result }))
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

	private async fetch(timeoutMs: number, target: Actions.WebhookTarget, variables: VariablesMap, events: EventRow[]): Promise<{ response: Response; text: string }> {
		return await withTimeout(timeoutMs, async abortController => {
			const response = await this.doFetch(target, variables, abortController, events)
			const text = await response.text()
			return { response, text }
		})
	}

	private async doFetch(target: Actions.WebhookTarget, variables: VariablesMap, abortController: AbortController, events: EventRow[]): Promise<Response> {
		const resolvedUrl = this.resolveVariables(target.url, variables)
		const resolvedHeaders = Object.fromEntries(Object.entries(target.headers ?? {})
			.map(([key, value]) => [key, this.resolveVariables(value, variables)]))

		const payload: WebhookRequestPayload = {
			events: events.map(this.formatEventPayload),
		}

		return await fetch(resolvedUrl, {
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
