import { Actions } from '@contember/schema'
import { HandledEvent, InvokeHandler, InvokeHandlerArgs } from './types'
import { VariablesMap } from '../model/VariablesManager'

const DEFAULT_TIMEOUT_MS = 30_000 // 30 seconds

export class WebhookTargetHandler implements InvokeHandler<Actions.WebhookTarget> {
	public async handle({ target, events, logger, variables }: InvokeHandlerArgs<Actions.WebhookTarget>): Promise<HandledEvent[]> {
		const abortController = new AbortController()
		const timeoutMs = target.timeoutMs

		const start = process.hrtime.bigint()
		const getDuration = () => Math.floor(Number((process.hrtime.bigint() - start) / BigInt(1_000_000)))
		try {
			const resolvedUrl = this.resolveVariables(target.url, variables)
			const resolvedHeaders = Object.fromEntries(Object.entries(target.headers ?? {})
				.map(([key, value]) => [key, this.resolveVariables(value, variables)]))

			const response = await withTimeout({ abortController, timeoutMs }, async () => {

				return await fetch(resolvedUrl, {
					method: 'POST',
					headers: {
						['User-Agent']: 'Contember Actions',
						...resolvedHeaders,
						['Content-type']: 'application/json',
					},
					signal: abortController.signal,
					body: JSON.stringify({
						events: events.map(it => ({
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
						})),
					}),
				})
			})
			let responseText
			try {
				responseText = await withTimeout({ abortController, timeoutMs }, async () => {
					return await response.text()
				})
			} catch {
			}
			const result = {
				ok: response.ok,
				code: response.status,
				durationMs: getDuration(),
				response: responseText,
				errorMessage: !response.ok ? response.statusText : undefined,
			}

			// todo: per-event response format

			return events.map(it => ({ target, row: it, result }))
		} catch (e) {
			logger.warn(e)
			const errorMessages = []
			let err = e
			while (typeof err === 'object' && err !== null && 'message' in err && typeof (err as any).message === 'string') {
				errorMessages.push((err as any).message)
				err = (err as any).cause
			}
			const result = {
				ok: false,
				errorMessage: errorMessages.length ? errorMessages.join('; ') : undefined,
				durationMs: getDuration(),
			}
			return events.map(it => ({ target, row: it, result }))
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

const withTimeout = async <T>({ abortController, timeoutMs }: { abortController: AbortController; timeoutMs?: number }, cb: () => Promise<T>): Promise<T> => {
	const timeoutId = setTimeout(() => {
		abortController.abort()
	}, timeoutMs ?? DEFAULT_TIMEOUT_MS)
	try {
		return await cb()
	} finally {
		clearTimeout(timeoutId)
	}
}
