import { Value } from '@contember/schema'

export type ColumnValue<E = never> = {
	value: PromiseLike<Value.AtomicValue<E> | undefined>
	fieldName: string
	columnName: string
	columnType: string
}

export type ResolvedColumnValue<E = never> = ColumnValue<E> & {
	resolvedValue: Value.AtomicValue<E>
}

export const resolveGenericValue = <T>(value: Value.GenericValueLike<T>): Promise<T> => {
	if (value instanceof Function) {
		value = value()
	}
	return Promise.resolve(value)
}

export const resolveRowData = async <E>(values: ColumnValue<E>[]): Promise<ResolvedColumnValue[]> => {
	return (await Promise.all(values.map(async it => ({ ...it, resolvedValue: await it.value })))).filter(
		(it): it is ResolvedColumnValue => it.resolvedValue !== undefined,
	)
}

export const rowDataToFieldValues = (values: ResolvedColumnValue[]): Record<string, Value.AtomicValue> =>
	values.reduce((acc, { fieldName, value }) => ({ ...acc, [fieldName]: value }), {})
