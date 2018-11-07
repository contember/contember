import { Input } from 'cms-common'

export const resolveValue = <T>(value: Input.GenericValueLike<T>): PromiseLike<T> => {
	if (value instanceof Function) {
		value = value()
	}
	return Promise.resolve(value)
}
