import { Input } from 'cms-common'

export const resolveValue = <T>(value: Input.GenericValueLike<T>): PromiseLike<T> => {
	if (typeof value === 'function') {
		value = value()
	}
	return Promise.resolve(value)
}
