/**
 * A minimal time-boxed memo. Entries are keyed by api key, so the map would otherwise grow with
 * every session the process ever sees — expired entries are swept once the map gets large rather
 * than on a timer.
 */
export class TtlCache<T> {
	private readonly entries = new Map<string, { value: T; expiresAt: number }>()

	constructor(
		private readonly ttlMs: number,
		private readonly sweepThreshold: number = 1000,
		private readonly now: () => number = () => Date.now(),
	) {}

	public async resolve(key: string, compute: () => Promise<T>): Promise<T> {
		const now = this.now()
		const cached = this.entries.get(key)
		if (cached && cached.expiresAt > now) {
			return cached.value
		}
		const value = await compute()
		this.entries.set(key, { value, expiresAt: now + this.ttlMs })
		this.sweep(now)
		return value
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
