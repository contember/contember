import { READ_AFTER_WRITE_HEADERS } from './ReadAfterWriteHeaders.js'

export interface WriteRefTrackerOptions {
	readonly ttlMs?: number
	readonly maxTokens?: number
	readonly now?: () => number
}

/**
 * Keeps the write references that no read has acknowledged yet, so that a following query can ask
 * to see them. Losing a token only costs consistency, never correctness — hence the TTL, the cap
 * and the fact that nothing here ever throws.
 */
export class WriteRefTracker {
	private readonly ttlMs: number
	private readonly maxTokens: number
	private readonly now: () => number

	/** token -> when it was inserted; a Map keeps the insertion order. */
	private readonly insertedAt = new Map<string, number>()

	constructor(options: WriteRefTrackerOptions = {}) {
		this.ttlMs = options.ttlMs ?? 30_000
		this.maxTokens = options.maxTokens ?? 16
		this.now = options.now ?? Date.now
	}

	/** Tokens currently outstanding (expired ones pruned), oldest first. */
	get tokens(): readonly string[] {
		this.prune()
		return Array.from(this.insertedAt.keys())
	}

	/** `{ 'X-Contember-Read-After': 'a,b' }` or `{}` when nothing is outstanding. */
	requestHeaders(): Record<string, string> {
		const tokens = this.tokens
		if (tokens.length === 0) {
			return {}
		}
		return { [READ_AFTER_WRITE_HEADERS.readAfter]: tokens.join(',') }
	}

	/** Adds the token from `X-Contember-Write-Ref`, removes those listed in `X-Contember-Read-After-Visible`. Never throws. */
	captureResponse(response: Response): void {
		try {
			const headers = response.headers
			// Acknowledge first: a token that arrives with this very response must survive.
			for (const token of parseTokenList(headers.get(READ_AFTER_WRITE_HEADERS.readAfterVisible))) {
				this.insertedAt.delete(token)
			}
			for (const token of parseTokenList(headers.get(READ_AFTER_WRITE_HEADERS.writeRef))) {
				this.add(token)
			}
			this.prune()
		} catch {
			// A response without usable headers simply carries no write reference.
		}
	}

	private add(token: string): void {
		// Re-adding refreshes the timestamp; Map.set keeps the original position.
		this.insertedAt.set(token, this.now())
		while (this.insertedAt.size > this.maxTokens) {
			const oldest = this.insertedAt.keys().next().value
			if (oldest === undefined) {
				return
			}
			this.insertedAt.delete(oldest)
		}
	}

	private prune(): void {
		const now = this.now()
		for (const [token, insertedAt] of this.insertedAt) {
			if (now - insertedAt >= this.ttlMs) {
				this.insertedAt.delete(token)
			}
		}
	}
}

const parseTokenList = (value: string | null): string[] => {
	if (value === null) {
		return []
	}
	return value.split(',').map(it => it.trim()).filter(it => it !== '')
}
