import { BindingError } from '../../BindingError'

// Bijective as in we need to supply the inverse and also guarantee that the values are unique.
// Provided this invariant, this should behave more or less like a regular map except it has a somewhat special
// iteration order. Unlike a regular map, which just honors insertion order, this also provides a special method
// changeKey. With this, we can change the key under which a value (that is already on the map) is accessible.
// With an ordinary map, that operation would require us to delete the original [K1, V] pair and insert
// a new one [K2, V]. That would however change the order of iteration. This main purpose of this data structure is
// the ability to avoid that and enable the value V to preserve its original place.
export class BijectiveIndexedMap<K, V> implements Map<K, V> {
	private valueStore: V[] = []
	private index: Map<K, number> = new Map()

	public readonly [Symbol.toStringTag] = 'BijectiveIndexedMap'

	public constructor(private readonly inverse: (value: V) => K) {}

	public get size(): number {
		return this.valueStore.length
	}

	public clear(): void {
		this.valueStore = []
		this.index.clear()
	}
	public delete(key: K): boolean {
		const index = this.index.get(key)

		if (!index) {
			return false
		}
		this.valueStore.splice(index, 1)
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
		return this.valueStore[index]
	}
	public has(key: K): boolean {
		return this.index.has(key)
	}
	public set(key: K, value: V): this {
		const existingIndex = this.index.get(key)

		if (existingIndex === undefined) {
			// Push returns new length, hence the -1
			const newIndex = this.valueStore.push(value) - 1
			this.index.set(key, newIndex)
		} else {
			this.valueStore[existingIndex] = value
		}
		return this
	}

	// This doesn't use the inverse in order to avoid confusion.
	// See the description above.
	public changeKey(oldKey: K, newKey: K): this {
		const index = this.index.get(oldKey)
		if (index === undefined) {
			throw new BindingError()
		}
		this.index.set(newKey, index)
		return this
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

	public values(): IterableIterator<V> {
		return this.valueStore.values()
	}
}
