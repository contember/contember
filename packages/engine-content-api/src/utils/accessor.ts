import { ImplementationException } from '../exception'
import { Interface } from './Interface'

export class Accessor<T> {
	private val: T | undefined

	get(): Interface<T> {
		if (!this.val) {
			throw new ImplementationException('Accessor value is not set')
		}

		return this.val
	}

	set(val: Interface<T>): void {
		this.val = val
	}
}
