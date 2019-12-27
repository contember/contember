import { ImplementationException } from '../exception'

export class Accessor<T> {
	private val: T | undefined

	get(): T {
		if (!this.val) {
			throw new ImplementationException('Accessor value is not set')
		}

		return this.val
	}

	set(val: T): void {
		this.val = val
	}
}
