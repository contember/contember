import { Value } from '@contember/schema'

export const resolveValue = <T>(value: Value.GenericValueLike<T>): PromiseLike<T> => {
	if (value instanceof Function) {
		value = value()
	}
	return Promise.resolve(value)
}
