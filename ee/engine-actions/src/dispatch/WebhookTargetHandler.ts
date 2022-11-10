import { Actions } from '@contember/schema'
import { EventRow, InvokeHandler, HandledEvent } from './types'
import { Logger } from '@contember/logger'

const DEFAULT_TIMEOUT_MS = 30_000 // 30 seconds

export class WebhookTargetHandler implements InvokeHandler<Actions.WebhookTarget> {
	public async handle(invocation: Actions.WebhookTarget, events: EventRow[], logger: Logger): Promise<HandledEvent[]> {
		const abortController = new AbortController()
		const timeoutMs = invocation.timeoutMs

		const start = process.hrtime.bigint()
		const getDuration = () => Math.floor(Number((process.hrtime.bigint() - start) / BigInt(1_000_000)))
		try {
			const response = await withTimeout({ abortController, timeoutMs }, async () => {
				return await fetch(invocation.url, {
					method: 'POST',
					headers: {
						['User-Agent']: 'Contember Actions',
						...invocation.headers,
						['Content-type']: 'application/json',
					},
					signal: abortController.signal,
					body: JSON.stringify({
						events: events.map(it => it.payload),
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

			return events.map(it => ({ invocation, row: it, result }))
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
			return events.map(it => ({ invocation, row: it, result }))
		}
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
