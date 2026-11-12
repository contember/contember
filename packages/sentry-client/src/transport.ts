export type Fetch = (url: string, init: RequestInit) => Promise<Response>

export type TransportLogger = (message: string) => void

export interface TransportOptions {
	readonly url: string
	readonly auth: string
	readonly fetch: Fetch
	readonly logger: TransportLogger
	/** Per request, connecting included. */
	readonly timeoutMs: number
	/** Envelopes sent at the same time; more are dropped. */
	readonly maxInFlight: number
	readonly now?: () => number
}

export interface Transport {
	/** Sends an envelope of the given rate-limit category, or drops it (rate limited, too many in flight). */
	send(envelope: string, category: string): void
	/** Resolves `true` once nothing is in flight, `false` when `timeoutMs` runs out first. */
	flush(timeoutMs: number): Promise<boolean>
}

const defaultRetryAfterMs = 60_000

/** `X-Sentry-Rate-Limits`: `<seconds>:<category;category|empty for all>:<scope>[:…], …`. */
export const parseRateLimits = (header: string, now: number): Map<string, number> => {
	const limits = new Map<string, number>()
	for (const limit of header.split(',')) {
		const [seconds, categories] = limit.trim().split(':')
		const delay = Number.parseInt(seconds, 10)
		const until = now + (Number.isNaN(delay) ? 60 : delay) * 1000
		for (const category of categories ? categories.split(';') : ['all']) {
			limits.set(category === '' ? 'all' : category, until)
		}
	}
	return limits
}

/** `Retry-After` as seconds or an HTTP date, in milliseconds from `now`. */
export const parseRetryAfter = (header: string | null, now: number): number => {
	if (header === null) {
		return defaultRetryAfterMs
	}
	const seconds = Number.parseInt(header, 10)
	if (!Number.isNaN(seconds)) {
		return seconds * 1000
	}
	const date = Date.parse(header)
	return Number.isNaN(date) ? defaultRetryAfterMs : Math.max(date - now, 0)
}

export const createFetchTransport = ({ url, auth, fetch, logger, timeoutMs, maxInFlight, now = Date.now }: TransportOptions): Transport => {
	const inFlight = new Set<Promise<void>>()
	const disabledUntil = new Map<string, number>()
	let lastProblem: string | undefined

	// one log line per kind of problem until a send succeeds again, so an outage does not flood the log
	const report = (problem: string) => {
		if (problem !== lastProblem) {
			lastProblem = problem
			logger(`Sentry: ${problem}`)
		}
	}

	const isRateLimited = (category: string): boolean => {
		const time = now()
		return (disabledUntil.get('all') ?? 0) > time || (disabledUntil.get(category) ?? 0) > time
	}

	const updateRateLimits = (response: Response) => {
		const time = now()
		const header = response.headers.get('x-sentry-rate-limits')
		const retryAfter = response.headers.get('retry-after')
		if (header) {
			for (const [category, until] of parseRateLimits(header, time)) {
				disabledUntil.set(category, until)
			}
		} else if (retryAfter !== null || response.status === 429) {
			disabledUntil.set('all', time + parseRetryAfter(retryAfter, time))
		}
	}

	const deliver = async (envelope: string): Promise<void> => {
		try {
			await post(envelope)
		} catch (error) {
			// e.g. a custom fetch that resolved to something other than a Response
			report(`could not process a delivery: ${error instanceof Error ? error.message : String(error)}`)
		}
	}

	const post = async (envelope: string): Promise<void> => {
		let response: Response
		try {
			response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-sentry-envelope', 'X-Sentry-Auth': auth },
				body: envelope,
				signal: AbortSignal.timeout(timeoutMs),
			})
		} catch (error) {
			report(`could not send an event: ${error instanceof Error ? error.message : String(error)}`)
			return
		}
		updateRateLimits(response)
		// the body is not needed; reading it releases the connection
		await response.arrayBuffer().catch(() => undefined)
		if (response.ok) {
			lastProblem = undefined
		} else if (response.status === 429) {
			report('rate limited, events are dropped until the limit expires')
		} else if (response.status === 413) {
			report('an event was too large and was dropped')
		} else {
			report(`an event was rejected with HTTP ${response.status}`)
		}
	}

	return {
		send(envelope, category) {
			if (isRateLimited(category)) {
				return
			}
			if (inFlight.size >= maxInFlight) {
				report(`more than ${maxInFlight} events in flight, an event was dropped`)
				return
			}
			const delivery = deliver(envelope).finally(() => inFlight.delete(delivery))
			inFlight.add(delivery)
		},
		async flush(flushTimeoutMs) {
			let timer: ReturnType<typeof setTimeout> | undefined
			const timeout = new Promise<false>(resolve => {
				timer = setTimeout(() => resolve(false), flushTimeoutMs)
			})
			const drained = (async () => {
				while (inFlight.size > 0) {
					await Promise.all(inFlight)
				}
				return true
			})()
			try {
				return await Promise.race([drained, timeout])
			} finally {
				clearTimeout(timer)
			}
		},
	}
}
