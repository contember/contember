/**
 * A minimal time-boxed memo. Entries are keyed by api key, so the map would otherwise grow with
 * every session the process ever sees — expired entries are swept once the map gets large rather
 * than on a timer.
 */
export class TtlCache<T> {
	private readonly entries = new Map<string, { value: Promise<T>; expiresAt: number }>()

	constructor(
		private readonly ttlMs: number,
		private readonly sweepThreshold: number = 1000,
		private readonly now: () => number = () => Date.now(),
	) {}

	public async resolve(key: string, compute: () => Promise<T>): Promise<T> {
		const cached = this.entries.get(key)
		if (cached && cached.expiresAt > this.now()) {
			return await cached.value
		}
		// The promise is stored before it settles, so a page's worth of parallel requests shares one
		// lookup — caching the resolved value instead would let every one of them miss and recompute.
		const pending = compute()
		this.entries.set(key, { value: pending, expiresAt: this.now() + this.ttlMs })
		try {
			const value = await pending
			// Charge the TTL from when the answer is actually known, not from before the lookup.
			this.entries.set(key, { value: pending, expiresAt: this.now() + this.ttlMs })
			this.sweep(this.now())
			return value
		} catch (error) {
			// Never memoise a failure — the next caller should try again.
			if (this.entries.get(key)?.value === pending) {
				this.entries.delete(key)
			}
			throw error
		}
	}

	public get size(): number {
		return this.entries.size
	}

	private sweep(now: number): void {
		if (this.entries.size < this.sweepThreshold) {
			return
		}
		for (const [key, entry] of this.entries) {
			if (entry.expiresAt <= now) {
				this.entries.delete(key)
			}
		}
	}
}
