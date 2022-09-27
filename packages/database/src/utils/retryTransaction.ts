import { SerializationFailureError } from '../client'

export interface RetryOptions {
	maxAttempts: number
	minTimeout: number
	maxTimeout: number
}

const defaultOptions: RetryOptions = {
	maxAttempts: 5,
	minTimeout: 20,
	maxTimeout: 100,
}

export const retryTransaction = async <R>(
	cb: () => Promise<R> | R,
	logger: (message: string) => void,
	options: Partial<RetryOptions> = {},
): Promise<R> => {
	let attempt = 0
	const minTimeout = options.minTimeout ?? defaultOptions.minTimeout
	const maxAttempts = options.maxAttempts ?? defaultOptions.maxAttempts
	const additionalTimeout = ((options.maxTimeout ?? defaultOptions.maxTimeout) - minTimeout) / maxAttempts
	const timeout = async (attempt: number) => {
		const timeout = Math.round(minTimeout + Math.random() * additionalTimeout * attempt)
		await new Promise(resolve => setTimeout(resolve, timeout))
		return timeout
	}

	do {
		attempt++
		try {
			return await cb()
		} catch (e) {
			if (!(e instanceof SerializationFailureError)) {
				throw e
			}
			if (attempt < maxAttempts) {
				const timeoutMs = await timeout(attempt)
				logger(`RETRY: Serialization failure (attempt #${attempt}, retrying after ${timeoutMs}ms)`)
			} else {
				logger(`ABORT: Serialization failure (attempt #${attempt})`)
				throw e
			}
		}
	} while (true)
}
