namespace Input {
	export interface Object<E = never> {
		[key: string]: ColumnValue<E>
	}

	export interface List<E = never> extends Array<ColumnValue<E>> {}

	export type PrimaryValue<E = never> = string | number | E

	export type AtomicValue<E = never> = PrimaryValue<E> | null | boolean
	export type ColumnValue<E = never> = AtomicValue<E> | Object<E> | List<E>

	export type GenericValueLike<T> = T | PromiseLike<T> | (() => T | PromiseLike<T>)

	export type ColumnValueLike<E = never> = GenericValueLike<ColumnValue<E>>

	export enum UpdateRelationOperation {
		connect = 'connect',
		disconnect = 'disconnect',
		create = 'create',
		update = 'update',
		upsert = 'upsert',
		delete = 'delete'
	}

	export enum CreateRelationOperation {
		connect = 'connect',
		create = 'create'
	}

	export interface ConnectRelationInput<E = never> {
		connect: UniqueWhere<E>
	}

	export interface CreateRelationInput<E = never> {
		create: CreateDataInput<E>
	}

	export interface DisconnectSpecifiedRelationInput<E = never> {
		disconnect: UniqueWhere<E>
	}

	export interface DeleteSpecifiedRelationInput<E = never> {
		delete: UniqueWhere<E>
	}

	export interface UpdateSpecifiedRelationInput<E = never> {
		update: { where: UniqueWhere<E>; data: UpdateDataInput<E> }
	}

	export interface UpsertSpecifiedRelationInput<E = never> {
		upsert: { where: UniqueWhere<E>; update: UpdateDataInput<E>; create: CreateDataInput<E> }
	}

	export interface DisconnectRelationInput {
		disconnect: true
	}

	export interface UpdateRelationInput<E = never> {
		update: UpdateDataInput<E>
	}

	export interface DeleteRelationInput {
		delete: true
	}

	export interface UpsertRelationInput<E = never> {
		upsert: { update: UpdateDataInput<E>; create: CreateDataInput<E> }
	}

	export interface CreateDataInput<E = never> {
		[column: string]: ColumnValue<E> | CreateOneRelationInput<E> | CreateManyRelationInput<E>
	}

	export type CreateOneRelationInput<E = never> = ConnectRelationInput<E> | CreateRelationInput<E>

	export type CreateManyRelationInput<E = never> = CreateOneRelationInput<E>[]

	export interface UpdateDataInput<E = never> {
		[column: string]: ColumnValue<E> | UpdateOneRelationInput<E> | UpdateManyRelationInput<E>
	}

	export interface UpdateInput<E = never> {
		where: UniqueWhere<E>
		data: UpdateDataInput<E>
	}

	export interface CreateInput<E = never> {
		data: CreateDataInput<E>
	}

	export interface DeleteInput<E = never> {
		where: UniqueWhere<E>
	}

	export interface UniqueQueryInput<E = never> {
		where: UniqueWhere<E>
	}

	export interface ListQueryInput<E = never> {
		where?: Where<Condition<ColumnValue<E>>>
		orderBy?: OrderBy[]
		offset?: number
		limit?: number
	}

	export type UpdateOneRelationInput<E = never> =
		| CreateRelationInput<E>
		| ConnectRelationInput<E>
		| DeleteRelationInput
		| DisconnectRelationInput
		| UpdateRelationInput<E>
		| UpsertRelationInput<E>

	export type UpdateManyRelationInput<E = never> = Array<
		| CreateRelationInput<E>
		| ConnectRelationInput<E>
		| DeleteSpecifiedRelationInput<E>
		| DisconnectSpecifiedRelationInput<E>
		| UpdateSpecifiedRelationInput<E>
		| UpsertSpecifiedRelationInput<E>
	>

	export enum OrderDirection {
		asc = 'asc',
		desc = 'desc'
	}

	export type FieldOrderBy = OrderDirection | OrderBy

	export interface OrderBy {
		[fieldName: string]: FieldOrderBy
	}

	export interface Condition<T = ColumnValue> {
		and?: Array<Condition<T>>
		or?: Array<Condition<T>>
		not?: Condition<T>

		eq?: T
		null?: boolean
		notEq?: T
		in?: T[]
		notIn?: T[]
		lt?: T
		lte?: T
		gt?: T
		gte?: T
		never?: true
		always?: true
	}

	export interface UniqueWhere<E = never> {
		[field: string]: PrimaryValue<E>
	}

	export type ComposedWhere<C> = {
		and?: Where<C>[]
		or?: Where<C>[]
		not?: Where<C>
	}

	export interface FieldWhere<C = Condition> {
		[name: string]: C | Where<C> | undefined | Where<C>[] //last one if for ComposedWhere
	}

	export type Where<C = Condition> = ComposedWhere<C> & FieldWhere<C>
}

export default Input
