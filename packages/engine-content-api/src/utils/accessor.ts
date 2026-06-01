import { ImplementationException } from '../exception.js'
import { Interface } from './Interface.js'

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
