export interface PrimaryReadWindowOptions {
	/** How long to read from the primary after a mutation response. Default: 1000 ms. Zero disables the window. */
	readonly durationMs?: number
	readonly now?: () => number
}

/** Share one window across clients for the same Content API endpoint and identity. */
export class PrimaryReadWindow {
	private readonly durationMs: number
	private readonly now: () => number
	private expiresAt = 0

	// A monotonic clock, so a system clock change cannot stretch or cut the window.
	constructor({ durationMs = 1000, now = () => performance.now() }: PrimaryReadWindowOptions = {}) {
		if (!Number.isFinite(durationMs) || durationMs < 0) {
			throw new Error('Primary read window duration must be a finite non-negative number')
		}
		this.durationMs = durationMs
		this.now = now
	}

	requestHeaders(): Record<string, string> {
		return this.now() < this.expiresAt ? { 'X-Contember-Force-Primary': '1' } : {}
	}

	captureResponse(response: Response): void {
		if (response.headers.get('X-Contember-Mutation') === '1') {
			this.expiresAt = this.now() + this.durationMs
		}
	}
}
