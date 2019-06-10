namespace Value {
	export interface Object<E = never> {
		[key: string]: FieldValue<E>
	}

	export interface List<E = never> extends Array<FieldValue<E>> {}

	export type PrimaryValue<E = never> = string | number | E

	export type AtomicValue<E = never> = PrimaryValue<E> | null | boolean
	export type FieldValue<E = never> = AtomicValue<E> | Value.Object<E> | List<E>

	export type GenericValueLike<T> = T | PromiseLike<T> | (() => T | PromiseLike<T>)

	export type ColumnValueLike<E = never> = GenericValueLike<FieldValue<E>>
}

export default Value
