/** A bounded per-worker set whose entries expire at their own deadline (milliseconds). */
export class ExpiringSet {
	private readonly entries = new Map<string, number>()

	constructor(
		private readonly maxSize: number,
		/** When full of unexpired entries: drop the oldest (`evict`) or refuse the new one (`refuse`). */
		private readonly whenFull: 'evict' | 'refuse',
	) {}

	/** `added` for a new key, `present` when the key is already there and not expired, `full` when refused. */
	public add(key: string, expiresAt: number, now: number): 'added' | 'present' | 'full' {
		const existing = this.entries.get(key)
		if (existing !== undefined && existing > now) {
			return 'present'
		}
		this.entries.delete(key)
		if (this.entries.size >= this.maxSize) {
			this.purgeExpired(now)
		}
		if (this.entries.size >= this.maxSize) {
			if (this.whenFull === 'refuse') {
				return 'full'
			}
			const oldest = this.entries.keys().next()
			if (!oldest.done) {
				this.entries.delete(oldest.value)
			}
		}
		this.entries.set(key, expiresAt)
		return 'added'
	}

	private purgeExpired(now: number): void {
		for (const [key, expiresAt] of this.entries) {
			if (expiresAt <= now) {
				this.entries.delete(key)
			}
		}
	}
}
