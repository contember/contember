export class Accessor<T> {
	private val: T | undefined

	get(): T {
		if (!this.val) {
			throw new Error()
		}

		return this.val
	}

	set(val: T): void {
		this.val = val
	}
}
