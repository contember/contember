import { EntityTypeLike, SchemaTypeLike } from '../types'
import { ContentClientInput } from '../types'
import { ContentEntitySelectionContext } from './ContentEntitySelection'


export interface TypedEntitySelection<TSchema extends SchemaTypeLike, TEntityName extends string, TEntity extends EntityTypeLike, TValue> {

	/** @internal */
	readonly context: ContentEntitySelectionContext<TEntityName>

	$$(): TypedEntitySelection<TSchema, TEntityName, TEntity, TValue & {
		[key in keyof TEntity['columns']]: TEntity['columns'][key]
	}>


	transform<T>(cb: (value: TValue) => T): TypedEntitySelection<TSchema, TEntityName, TEntity, T>

	$<
		TNestedValue,
		TKey extends (keyof TEntity['columns'] | keyof TEntity['hasMany'] | keyof TEntity['hasManyBy'] | keyof TEntity['hasOne']) & string,
		TAlias extends string | null = null
	>(
		name: TKey,
		...args: TypedEntitySelectionParams<TSchema, TEntity, TKey, TNestedValue, TAlias>
	): TypedEntitySelection<TSchema, TEntityName, TEntity, TValue & {
		[key in TAlias extends null ? TKey : TAlias]: TypedEntitySelectionResult<TEntity, TKey, TNestedValue>
	}>
}

export type TypedEntitySelectionCallback<
	TSchema extends SchemaTypeLike,
	EntityName extends string,
	TEntity extends EntityTypeLike,
	TValue,
> = (select: TypedEntitySelection<TSchema, EntityName, TEntity, {}>) => TypedEntitySelection<TSchema, EntityName, TEntity, TValue>


export type TypedHasManyArgs<TEntity extends EntityTypeLike, TKey extends keyof TEntity['hasMany'] & string, TAlias extends string | null = null> =
	& ContentClientInput.HasManyRelationInput<TEntity['hasMany'][TKey]>
	& { as?: TAlias }

export type TypedHasManyFields<TSchema extends SchemaTypeLike, TEntity extends EntityTypeLike, TKey extends keyof TEntity['hasMany'] & string, TNestedValue> =
	| TypedEntitySelectionCallback<TSchema, TEntity['hasMany'][TKey]['name'], TEntity['hasMany'][TKey], TNestedValue>
	| TypedEntitySelection<TSchema, TEntity['hasMany'][TKey]['name'], TEntity['hasMany'][TKey], TNestedValue>

export type TypedHasManyParams<TSchema extends SchemaTypeLike, TEntity extends EntityTypeLike, TKey extends keyof TEntity['hasMany'] & string, TNestedValue, TAlias extends string | null = null> =
	| [
			args: TypedHasManyArgs<TEntity, TKey, TAlias>,
			fields: TypedHasManyFields<TSchema, TEntity, TKey, TNestedValue>,
	]
	| [
			fields: TypedHasManyFields<TSchema, TEntity, TKey, TNestedValue>,
	]


export type TypedHasManyByArgs<TEntity extends EntityTypeLike, TKey extends keyof TEntity['hasManyBy'] & string, TAlias extends string | null = null> =
	& ContentClientInput.HasManyByRelationInput<TEntity['hasManyBy'][TKey]['entity'], TEntity['hasManyBy'][TKey]['by']>
	& { as?: TAlias }

export type TypedHasManyByFields<TSchema extends SchemaTypeLike, TEntity extends EntityTypeLike, TKey extends keyof TEntity['hasManyBy'] & string, TNestedValue> =
	| TypedEntitySelectionCallback<TSchema, TEntity['hasManyBy'][TKey]['entity']['name'], TEntity['hasManyBy'][TKey]['entity'], TNestedValue>
	| TypedEntitySelection<TSchema, TEntity['hasManyBy'][TKey]['entity']['name'], TEntity['hasManyBy'][TKey]['entity'], TNestedValue>

export type TypedHasManyByParams<TSchema extends SchemaTypeLike, TEntity extends EntityTypeLike, TKey extends keyof TEntity['hasManyBy'] & string, TNestedValue, TAlias extends string | null = null> =
	| [
		args: TypedHasManyByArgs<TEntity, TKey, TAlias>,
		fields: TypedHasManyByFields<TSchema, TEntity, TKey, TNestedValue>
	]


export type TypedHasOneArgs<TEntity extends EntityTypeLike, TKey extends keyof TEntity['hasOne'] & string, TAlias extends string | null = null> =
	& ContentClientInput.HasOneRelationInput<TEntity['hasOne'][TKey]>
	& { as?: TAlias }

export type TypedHasOneFields<TSchema extends SchemaTypeLike, TEntity extends EntityTypeLike, TKey extends keyof TEntity['hasOne'] & string, TNestedValue> =
	| TypedEntitySelectionCallback<TSchema, TEntity['hasOne'][TKey]['name'], TEntity['hasOne'][TKey], TNestedValue>
	| TypedEntitySelection<TSchema, TEntity['hasOne'][TKey]['name'], TEntity['hasOne'][TKey], TNestedValue>

export type TypedHasOneParams<TSchema extends SchemaTypeLike, TEntity extends EntityTypeLike, TKey extends keyof TEntity['hasOne'] & string, TNestedValue, TAlias extends string | null = null> =
	| [
			args: TypedHasOneArgs<TEntity, TKey, TAlias>,
			fields: TypedHasOneFields<TSchema, TEntity, TKey, TNestedValue>
	]
	| [
			fields: TypedHasOneFields<TSchema, TEntity, TKey, TNestedValue>
	]


export type TypedColumnArgs<TAlias extends string | null = null> = { as?: TAlias }
export type TypedColumnParams<TAlias extends string | null = null> =
	| [
			args: TypedColumnArgs<TAlias>
	]
	| []

export type TypedEntitySelectionParams<TSchema extends SchemaTypeLike, TEntity extends EntityTypeLike, TKey extends string, TNestedValue, TAlias extends string | null = null> =
	TKey extends keyof TEntity['columns'] ? TypedColumnParams<TAlias>
		: TKey extends keyof TEntity['hasMany'] ? TypedHasManyParams<TSchema, TEntity, TKey, TNestedValue, TAlias>
			: TKey extends keyof TEntity['hasManyBy'] ? TypedHasManyByParams<TSchema, TEntity, TKey, TNestedValue, TAlias>
				: TKey extends keyof TEntity['hasOne'] ? TypedHasOneParams<TSchema, TEntity, TKey, TNestedValue, TAlias>
					: never

export type TypedEntitySelectionResult<TEntity extends EntityTypeLike, TKey extends string, TValue> =
	TKey extends keyof TEntity['columns'] ? TEntity['columns'][TKey]
		: TKey extends keyof TEntity['hasMany'] ? TValue[]
			: TKey extends keyof TEntity['hasManyBy'] ? null | TValue
				: TKey extends keyof TEntity['hasOne'] ? null | TValue
					: never
