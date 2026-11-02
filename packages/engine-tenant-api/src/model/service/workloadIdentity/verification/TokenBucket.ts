/** Per-key token buckets (per worker), bounded in the number of keys they track. */
export class TokenBuckets {
	private readonly buckets = new Map<string, { tokens: number; updatedAt: number }>()

	constructor(
		private readonly capacity: number,
		private readonly refillPerSecond: number,
		private readonly maxKeys: number,
	) {}

	public take(key: string, now: number): boolean {
		const bucket = this.buckets.get(key) ?? { tokens: this.capacity, updatedAt: now }
		const tokens = Math.min(this.capacity, bucket.tokens + Math.max(0, now - bucket.updatedAt) / 1000 * this.refillPerSecond)
		const allowed = tokens >= 1
		this.buckets.delete(key)
		if (this.buckets.size >= this.maxKeys) {
			const oldest = this.buckets.keys().next()
			if (!oldest.done) {
				this.buckets.delete(oldest.value)
			}
		}
		this.buckets.set(key, { tokens: allowed ? tokens - 1 : tokens, updatedAt: now })
		return allowed
	}
}
