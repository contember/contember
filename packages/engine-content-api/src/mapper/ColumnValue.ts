import { Value } from '@contember/schema'
import { getFulfilledValues, getRejections } from '../utils'

export type ColumnValue<E = never> = {
	value: PromiseLike<Value.FieldValue<E> | undefined>
	fieldName: string
	columnName: string
	columnType: string
}

export type ResolvedColumnValue<E = never> = ColumnValue<E> & {
	resolvedValue: Value.FieldValue<E>
}

export const resolveGenericValue = <T>(value: Value.GenericValueLike<T>): Promise<T> => {
	if (value instanceof Function) {
		value = value()
	}
	return Promise.resolve(value)
}

export const resolveRowData = async <E>(
	values: ColumnValue<E>[],
): Promise<ResolvedColumnValue<Exclude<E, undefined>>[]> => {
	const valuePromises = values.map(async (it): Promise<ResolvedColumnValue<E | undefined>> => ({ ...it, resolvedValue: await it.value }))
	const settledValues = await Promise.allSettled(valuePromises)
	const failed = getRejections(settledValues)
	if (failed.length > 0) {
		throw failed[0]
	}
	const fulfilled = getFulfilledValues(settledValues)
	return fulfilled.filter((it): it is ResolvedColumnValue<Exclude<E, undefined>> => it.resolvedValue !== undefined)
}

export const rowDataToFieldValues = (values: ResolvedColumnValue[]): Record<string, Value.AtomicValue> =>
	values.reduce((acc, { fieldName, value }) => ({ ...acc, [fieldName]: value }), {})
