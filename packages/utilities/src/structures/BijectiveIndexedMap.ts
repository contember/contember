// Bijective as in we need to supply the inverse and also guarantee that the values are unique.
// Provided this invariant, this should behave more or less like a regular map except it has a somewhat special
// iteration order. Unlike a regular map, which just honors insertion order, this also provides a special method
// changeKey. With this, we can change the key under which a value (that is already on the map) is accessible.
// With an ordinary map, that operation would require us to delete the original [K1, V] pair and insert
// a new one [K2, V]. That would however change the order of iteration. This main purpose of this data structure is
// the ability to avoid that and enable the value V to preserve its original place.
export class BijectiveIndexedMap<K, V> implements Map<K, V> {
	private readonly valueStore: Map<number, V>
	private readonly index: Map<K, number>
	private indexSeed: number

	private readonly inverse: (value: V) => K

	public readonly [Symbol.toStringTag] = 'BijectiveIndexedMap'

	public constructor(originalMap: BijectiveIndexedMap<K, V>)
	public constructor(inverse: (value: V) => K)
	public constructor(inverseOrMap: BijectiveIndexedMap<K, V> | ((value: V) => K)) {
		if (inverseOrMap instanceof BijectiveIndexedMap) {
			this.valueStore = new Map(inverseOrMap.valueStore)
			this.index = new Map(inverseOrMap.index)
			this.indexSeed = inverseOrMap.indexSeed
			this.inverse = inverseOrMap.inverse
		} else {
			this.valueStore = new Map()
			this.index = new Map()
			this.indexSeed = 0
			this.inverse = inverseOrMap
		}
	}

	private getNewIndex() {
		return this.indexSeed++
	}

	public get size(): number {
		return this.valueStore.size
	}

	public clear(): void {
		this.valueStore.clear()
		this.index.clear()
	}
	public delete(key: K): boolean {
		const index = this.index.get(key)

		if (index === undefined) {
			return false
		}
		this.valueStore.delete(index)
		this.index.delete(key)
		return true
	}
	public forEach(callback: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
		for (const [key, value] of this.entries()) {
			callback.call(thisArg, value, key, this)
		}
	}

	public get(key: K): V | undefined {
		const index = this.index.get(key)

		if (index === undefined) {
			return undefined
		}
		return this.valueStore.get(index)
	}
	public has(key: K): boolean {
		return this.index.has(key)
	}
	public set(key: K, value: V): this {
		const existingIndex = this.index.get(key)

		if (existingIndex === undefined) {
			const newIndex = this.getNewIndex()
			this.index.set(key, newIndex)
			this.valueStore.set(newIndex, value)
		} else {
			this.valueStore.set(existingIndex, value)
		}
		return this
	}

	// This doesn't use the inverse in order to avoid confusion.
	// See the description above.
	public changeKey(oldKey: K, newKey: K): this {
		const index = this.index.get(oldKey)
		if (index === undefined) {
			throw new Error()
		}
		this.index.delete(oldKey)
		this.index.set(newKey, index)
		return this
	}

	public changeKeyOrder(newOrder: Iterable<K>) {
		for (const key of newOrder) {
			const keyIndex = this.index.get(key)
			if (keyIndex === undefined) {
				throw new Error()
			}
			const value = this.valueStore.get(keyIndex)!

			// This effectively removes value from wherever it was and puts it at the end.
			// Provided newOrder.size is the same as valueStore, by the end of this loop
			// the values will be in the correct order.
			this.valueStore.delete(keyIndex)
			this.valueStore.set(keyIndex, value)
		}
	}

	public *[Symbol.iterator](): IterableIterator<[K, V]> {
		yield* this.entries()
	}

	public *entries(): IterableIterator<[K, V]> {
		for (const value of this.values()) {
			yield [this.inverse(value), value]
		}
	}

	public *keys(): IterableIterator<K> {
		for (const value of this.values()) {
			yield this.inverse(value)
		}
	}

	public *values(): IterableIterator<V> {
		for (const value of this.valueStore.values()) {
			if (value === undefined) {
				continue
			}
			yield value
		}
	}
}
