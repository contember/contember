export class WeakIdCache<K extends object> {
	private readonly cache = new WeakMap<K, string>()
	private seed = 0
	private readonly rootId = this.seedToId(this.seed++)

	public getId(key: K): string {
		let existing = this.cache.get(key)

		if (existing === undefined) {
			this.cache.set(key, (existing = this.seedToId(this.seed++)))
		}
		return existing
	}

	public getOptionalKeyId(key: K | undefined): string {
		if (key === undefined) {
			return this.rootId
		}
		return this.getId(key)
	}

	private seedToId(seed: number): string {
		return seed.toFixed(0)
	}
}
