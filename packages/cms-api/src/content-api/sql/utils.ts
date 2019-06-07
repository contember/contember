import { Value } from 'cms-common'

export const resolveValue = <T>(value: Value.GenericValueLike<T>): PromiseLike<T> => {
	if (value instanceof Function) {
		value = value()
	}
	return Promise.resolve(value)
}
