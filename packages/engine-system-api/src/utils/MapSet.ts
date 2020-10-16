export class MapSet<K, V> {
	public readonly map = new Map<K, Set<V>>()

	has(key: K): boolean {
		return this.map.has(key)
	}

	get(key: K): Set<V> | undefined {
		return this.map.get(key)
	}

	set(key: K, value: Set<V>): void {
		this.map.set(key, value)
	}

	add(key: K, ...values: V[]): Set<V> {
		let set = this.map.get(key)
		if (!set) {
			set = new Set<V>()
			this.map.set(key, set)
		}
		for (const value of values) {
			set.add(value)
		}
		return set
	}

	merge(...mapSets: MapSet<K, V>[]): this {
		for (const mapSet of mapSets) {
			mapSet.map.forEach((value, key) => {
				this.add(key, ...value.values())
			})
		}
		return this
	}
}
