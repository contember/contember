import { Input, JSONObject } from '@contember/schema'
import { EntityTypeLike } from './Schema'


export namespace ContentClientInput {
	export type ConnectRelationInput<TEntity extends EntityTypeLike> = {
		readonly connect: UniqueWhere<TEntity>
	}

	export type CreateRelationInput<TEntity extends EntityTypeLike> = {
		readonly create: CreateDataInput<TEntity>
	}

	export type ConnectOrCreateInput<TEntity extends EntityTypeLike> = {
		readonly connect: UniqueWhere<TEntity>
		readonly create: CreateDataInput<TEntity>
	}

	export type ConnectOrCreateRelationInput<TEntity extends EntityTypeLike> = {
		readonly connectOrCreate: ConnectOrCreateInput<TEntity>
	}

	export type DisconnectSpecifiedRelationInput<TEntity extends EntityTypeLike> = {
		readonly disconnect: UniqueWhere<TEntity>
	}

	export type DeleteSpecifiedRelationInput<TEntity extends EntityTypeLike> = {
		readonly delete: UniqueWhere<TEntity>
	}

	export type UpdateSpecifiedRelationInput<TEntity extends EntityTypeLike> = {
		readonly update: {
			readonly by: UniqueWhere<TEntity>
			readonly data: UpdateDataInput<TEntity>
		}
	}

	export type UpsertSpecifiedRelationInput<TEntity extends EntityTypeLike> = {
		readonly upsert: {
			readonly by: UniqueWhere<TEntity>
			readonly update: UpdateDataInput<TEntity>
			readonly  create: CreateDataInput<TEntity>
		}
	}

	export type DisconnectRelationInput = {
		readonly disconnect: true
	}

	export type UpdateRelationInput<TEntity extends EntityTypeLike> = {
		readonly update: UpdateDataInput<TEntity>
	}

	export type DeleteRelationInput = {
		readonly delete: true
	}

	export type UpsertRelationInput<TEntity extends EntityTypeLike> = {
		readonly upsert: {
			readonly update: UpdateDataInput<TEntity>
			readonly create: CreateDataInput<TEntity>
		}
	}

	export type CreateDataInput<TEntity extends EntityTypeLike> =
		& {
			readonly [key in keyof TEntity['columns']]?: TEntity['columns'][key]
		}
		& {
			readonly [key in keyof TEntity['hasMany']]?: CreateManyRelationInput<TEntity['hasMany'][key]>
		}
		& {
			readonly [key in keyof TEntity['hasOne']]?: CreateOneRelationInput<TEntity['hasOne'][key]>
		}

	export type CreateOneRelationInput<TEntity extends EntityTypeLike> =
		| ConnectRelationInput<TEntity>
		| CreateRelationInput<TEntity>
		| ConnectOrCreateRelationInput<TEntity>

	export type CreateManyRelationInput<TEntity extends EntityTypeLike> = readonly CreateOneRelationInput<TEntity>[]

	export type UpdateDataInput<TEntity extends EntityTypeLike> =
		& {
			readonly [key in keyof TEntity['columns']]?: TEntity['columns'][key]
		}
		& {
			readonly [key in keyof TEntity['hasMany']]?: UpdateManyRelationInput<TEntity['hasMany'][key]>
		}
		& {
			readonly [key in keyof TEntity['hasOne']]?: UpdateOneRelationInput<TEntity['hasOne'][key]>
		}

	export type UpdateInput<TEntity extends EntityTypeLike> = {
		readonly by: UniqueWhere<TEntity>
		readonly filter?: Where<TEntity>
		readonly data: UpdateDataInput<TEntity>
	}

	export type UpsertInput<TEntity extends EntityTypeLike> = {
		readonly by: UniqueWhere<TEntity>
		readonly filter?: Where<TEntity>
		readonly update: UpdateDataInput<TEntity>
		readonly create: CreateDataInput<TEntity>
	}

	export type CreateInput<TEntity extends EntityTypeLike> = {
		readonly data: CreateDataInput<TEntity>
	}

	export type DeleteInput<TEntity extends EntityTypeLike> = {
		readonly by: UniqueWhere<TEntity>
		readonly filter?: Where<TEntity>
	}

	export type UniqueQueryInput<TEntity extends EntityTypeLike> = {
		readonly by: UniqueWhere<TEntity>
		readonly filter?: Where<TEntity>
	}

	export type ListQueryInput<TEntity extends EntityTypeLike> = {
		readonly filter?: Where<TEntity>
		readonly orderBy?: readonly OrderBy<TEntity>[]
		readonly offset?: number
		readonly limit?: number
	}

	export type PaginationQueryInput<TEntity extends EntityTypeLike> = {
		readonly filter?: Where<TEntity>
		readonly orderBy?: readonly OrderBy<TEntity>[]
		readonly skip?: number
		readonly first?: number
	}

	export type HasOneRelationInput<TEntity extends EntityTypeLike> = {
		readonly filter?: Where<TEntity>
	}

	export type HasManyByRelationInput<TEntity extends EntityTypeLike, TUnique extends JSONObject> = {
		readonly by: TUnique
		readonly filter?: Where<TEntity>
	}

	export type HasManyRelationInput<TEntity extends EntityTypeLike> = ListQueryInput<TEntity>
	export type HasManyRelationPaginateInput<TEntity extends EntityTypeLike> = PaginationQueryInput<TEntity>


	export type UpdateOneRelationInput<TEntity extends EntityTypeLike> =
		| CreateRelationInput<TEntity>
		| ConnectRelationInput<TEntity>
		| ConnectOrCreateRelationInput<TEntity>
		| DeleteRelationInput
		| DisconnectRelationInput
		| UpdateRelationInput<TEntity>
		| UpsertRelationInput<TEntity>

	export type UpdateManyRelationInputItem<TEntity extends EntityTypeLike> =
		| CreateRelationInput<TEntity>
		| ConnectRelationInput<TEntity>
		| ConnectOrCreateRelationInput<TEntity>
		| DeleteSpecifiedRelationInput<TEntity>
		| DisconnectSpecifiedRelationInput<TEntity>
		| UpdateSpecifiedRelationInput<TEntity>
		| UpsertSpecifiedRelationInput<TEntity>


	export type UpdateManyRelationInput<TEntity extends EntityTypeLike> = Array<UpdateManyRelationInputItem<TEntity>>


	export type FieldOrderBy<TEntity extends EntityTypeLike> =
		& {
			readonly [key in keyof TEntity['columns']]?: `${Input.OrderDirection}` | null
		}
		& {
			readonly [key in keyof TEntity['hasMany']]?: FieldOrderBy<TEntity['hasMany'][key]> | null
		}
		& {
			readonly [key in keyof TEntity['hasOne']]?: FieldOrderBy<TEntity['hasOne'][key]> | null
		}

	export type OrderBy<TEntity extends EntityTypeLike> =
		& {
			readonly _random?: boolean
			readonly _randomSeeded?: number
		}
		& FieldOrderBy<TEntity>


	export type UniqueWhere<TEntity extends EntityTypeLike> = TEntity['unique']


	export type Where<TEntity extends EntityTypeLike> =
		& {
			readonly and?: (readonly (Where<TEntity>)[]) | null
			readonly or?: (readonly (Where<TEntity>)[]) | null
			readonly not?: Where<TEntity> | null
		}
		& {
			readonly [key in keyof TEntity['columns']]?: Input.Condition<TEntity['columns'][key]> | null
		}
		& {
			readonly [key in keyof TEntity['hasMany']]?: Where<TEntity['hasMany'][key]> | null
		}
		& {
			readonly [key in keyof TEntity['hasOne']]?: Where<TEntity['hasOne'][key]> | null
		}


	export type AnyOrderBy = Input.OrderBy<`${Input.OrderDirection}`>[]
	export type AnyListQueryInput =
		& Omit<Input.ListQueryInput, 'orderBy'>
		& { readonly orderBy?: AnyOrderBy }
}
