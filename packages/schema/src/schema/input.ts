import Value from './value'

namespace Input {
	export type PrimaryValue<E = never> = Value.PrimaryValue<E>
	export type ColumnValue<E = never> = Value.FieldValue<E>

	export enum UpdateRelationOperation {
		connect = 'connect',
		disconnect = 'disconnect',
		create = 'create',
		update = 'update',
		upsert = 'upsert',
		delete = 'delete',
	}

	export enum CreateRelationOperation {
		connect = 'connect',
		create = 'create',
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
		update: { by: UniqueWhere<E>; data: UpdateDataInput<E> }
	}

	export interface UpsertSpecifiedRelationInput<E = never> {
		upsert: { by: UniqueWhere<E>; update: UpdateDataInput<E>; create: CreateDataInput<E> }
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
		[column: string]: Value.FieldValue<E> | CreateOneRelationInput<E> | CreateManyRelationInput<E>
	}

	export type CreateOneRelationInput<E = never> = { alias?: string } & (
		| ConnectRelationInput<E>
		| CreateRelationInput<E>
	)

	export type CreateManyRelationInput<E = never> = Array<CreateOneRelationInput<E>>

	export interface UpdateDataInput<E = never> {
		[column: string]: Value.FieldValue<E> | UpdateOneRelationInput<E> | UpdateManyRelationInput<E>
	}

	export interface UpdateInput<E = never> {
		by: UniqueWhere<E>
		filter?: OptionalWhere<E>
		data: UpdateDataInput<E>
	}

	export interface CreateInput<E = never> {
		data: CreateDataInput<E>
	}

	export interface DeleteInput<E = never> {
		by: UniqueWhere<E>
		filter?: OptionalWhere<E>
	}

	export interface UniqueQueryInput<E = never> {
		by: UniqueWhere<E>
		filter?: OptionalWhere<E>
	}

	export interface ListQueryInput<E = never> {
		filter?: OptionalWhere<E>
		orderBy?: OrderBy[]
		offset?: number
		limit?: number
	}

	export interface PaginationQueryInput<E = never> {
		filter?: OptionalWhere<E>
		orderBy?: OrderBy[]
		skip?: number
		first?: number
	}

	/** @deprecated */
	export type SelectQueryInput<E = never> = PaginationQueryInput<E>

	export type UpdateOneRelationInput<E = never> =
		| CreateRelationInput<E>
		| ConnectRelationInput<E>
		| DeleteRelationInput
		| DisconnectRelationInput
		| UpdateRelationInput<E>
		| UpsertRelationInput<E>

	export type UpdateManyRelationInputItem<E = never> = { alias?: string } & (
		| CreateRelationInput<E>
		| ConnectRelationInput<E>
		| DeleteSpecifiedRelationInput<E>
		| DisconnectSpecifiedRelationInput<E>
		| UpdateSpecifiedRelationInput<E>
		| UpsertSpecifiedRelationInput<E>
	)

	export type UpdateManyRelationInput<E = never> = Array<UpdateManyRelationInputItem<E>>

	export enum OrderDirection {
		asc = 'asc',
		desc = 'desc',
	}

	// generics required by admin
	export type FieldOrderBy<T = OrderDirection> = T | OrderBy<T>

	export interface OrderByFields<T = OrderDirection> {
		[fieldName: string]: FieldOrderBy<T>
	}

	export type OrderBy<T = OrderDirection> = OrderByFields<T> & { _random?: boolean; _randomSeeded?: number }

	export interface Condition<T = Value.FieldValue> {
		and?: Array<Condition<T>>
		or?: Array<Condition<T>>
		not?: Condition<T>

		eq?: T
		null?: boolean // deprecated
		isNull?: boolean
		notEq?: T
		in?: T[]
		notIn?: T[]
		lt?: T
		lte?: T
		gt?: T
		gte?: T
		never?: true
		always?: true
		contains?: string
		startsWith?: string
		endsWith?: string
		containsCI?: string
		startsWithCI?: string
		endsWithCI?: string
	}

	export interface UniqueWhere<E = never> {
		[field: string]: Value.PrimaryValue<E> | UniqueWhere<E>
	}

	export type ComposedWhere<C, Opt = never> = {
		and?: (Where<C, Opt> | Opt)[]
		or?: (Where<C, Opt> | Opt)[]
		not?: Where<C, Opt>
	}

	export interface FieldWhere<C = Condition, Opt = never> {
		[name: string]: C | Where<C, Opt> | undefined | (Where<C, Opt> | Opt)[] //last one if for ComposedWhere
	}

	export type Where<C = Condition, Opt = never> = ComposedWhere<C, Opt> & FieldWhere<C, Opt>

	export type OptionalWhere<E = never> = Where<Condition<Value.FieldValue<E>>, null | undefined>

	export enum FieldMeta {
		readable = 'readable',
		updatable = 'updatable',
	}
}

export default Input
