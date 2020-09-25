import { SerializationFailureError } from '../client'

export interface RetryOptions {
	maxAttempts: number
	minTimeout: number
	maxTimeout: number
}

const defaultOptions: RetryOptions = {
	maxAttempts: 5,
	minTimeout: 20,
	maxTimeout: 70,
}

export const retryTransaction = async <R>(
	cb: () => Promise<R> | R,
	options: Partial<RetryOptions> = {},
): Promise<R> => {
	let attempt = 0
	const minTimeout = options.minTimeout ?? defaultOptions.minTimeout
	const additionalTimeout = (options.maxTimeout ?? defaultOptions.maxTimeout) - minTimeout
	const maxAttempts = options.maxAttempts ?? defaultOptions.maxAttempts
	const timeout = async () =>
		await new Promise(resolve => setTimeout(resolve, Math.round(minTimeout + Math.random() * additionalTimeout)))

	do {
		attempt++
		try {
			return await cb()
		} catch (e) {
			if (!(e instanceof SerializationFailureError)) {
				throw e
			}
			if (attempt < maxAttempts) {
				// eslint-disable-next-line no-console
				console.error('Serialization failure, retrying')
				await timeout()
			} else {
				// eslint-disable-next-line no-console
				console.error('Serialization failure, aborting')
				throw e
			}
		}
	} while (true)
}
