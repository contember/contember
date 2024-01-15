import { EntityTypeLike, SchemaTypeLike } from '../types/Schema'
import { ContentClientInput } from '../types'
import { ContentEntitySelectionContext } from './ContentEntitySelection'

export type TypedEntitySelectionCallback<
	TSchema extends SchemaTypeLike,
	EntityName extends string,
	TEntity extends EntityTypeLike,
	TValue
> = (select: TypedEntitySelection<TSchema, EntityName, TEntity, {}>) => TypedEntitySelection<TSchema, EntityName, TEntity, TValue>

export interface TypedEntitySelection<TSchema extends SchemaTypeLike, TEntityName extends string, TEntity extends EntityTypeLike, TValue> {

	/** @internal */
	readonly context: ContentEntitySelectionContext<TEntityName>,

	$$(): TypedEntitySelection<TSchema, TEntityName, TEntity, TValue & {
		[key in keyof TEntity['columns']]: TEntity['columns'][key]
	}>

	$<
		TKey extends (keyof TEntity['columns']) & string,
		TAlias extends string | null = null
	>(
		name: TKey,
		args?: {as?: TAlias},
	): TypedEntitySelection<TSchema, TEntityName, TEntity, TValue & {
		[key in TAlias extends null ? TKey : TAlias]: TEntity['columns'][key]
	}>

	$<
		TNestedValue,
		TNestedKey extends keyof TEntity['hasMany'] & string,
		TAlias extends string | null = null,
	>(
		name: TNestedKey,
		args: ContentClientInput.HasManyRelationInput<TEntity['hasMany'][TNestedKey]> & { as?: TAlias },
		fields:
			| TypedEntitySelectionCallback<TSchema, TEntity['hasMany'][TNestedKey]['name'], TEntity['hasMany'][TNestedKey], TNestedValue>
			| TypedEntitySelection<TSchema, TEntity['hasMany'][TNestedKey]['name'], TEntity['hasMany'][TNestedKey], TNestedValue>,
	): TypedEntitySelection<TSchema, TEntityName, TEntity, TValue & {
		[key in TAlias extends null ? TNestedKey : TAlias]: TNestedValue[]
	}>

	$<
		TNestedValue,
		TNestedKey extends keyof TEntity['hasMany'] & string,
		TAlias extends string | null = null,
	>(
		name: TNestedKey,
		fields:
			| TypedEntitySelectionCallback<TSchema, TEntity['hasMany'][TNestedKey]['name'], TEntity['hasMany'][TNestedKey], TNestedValue>
			| TypedEntitySelection<TSchema, TEntity['hasMany'][TNestedKey]['name'], TEntity['hasMany'][TNestedKey], TNestedValue>,
	): TypedEntitySelection<TSchema, TEntityName, TEntity, TValue & {
		[key in TAlias extends null ? TNestedKey : TAlias]: TNestedValue[]
	}>

	$<
		TNestedValue,
		TNestedKey extends keyof TEntity['hasManyBy'] & string,
		TAlias extends string | null = null,
	>(
		name: TNestedKey,
		args: ContentClientInput.HasManyByRelationInput<TEntity['hasManyBy'][TNestedKey]['entity'], TEntity['hasManyBy'][TNestedKey]['by']> & { as?: TAlias },
		fields:
			| TypedEntitySelectionCallback<TSchema, TEntity['hasManyBy'][TNestedKey]['entity']['name'], TEntity['hasManyBy'][TNestedKey]['entity'], TNestedValue>
			| TypedEntitySelection<TSchema, TEntity['hasManyBy'][TNestedKey]['entity']['name'], TEntity['hasManyBy'][TNestedKey]['entity'], TNestedValue>,
	): TypedEntitySelection<TSchema, TEntityName, TEntity, TValue & {
		[key in TAlias extends null ? TNestedKey : TAlias]: null | TNestedValue
	}>

	$<
		TNestedValue,
		TNestedKey extends keyof TEntity['hasManyBy'] & string,
		TAlias extends string | null = null,
	>(
		name: TNestedKey,
		fields:
			| TypedEntitySelectionCallback<TSchema, TEntity['hasManyBy'][TNestedKey]['entity']['name'], TEntity['hasManyBy'][TNestedKey]['entity'], TNestedValue>
			| TypedEntitySelection<TSchema, TEntity['hasManyBy'][TNestedKey]['entity']['name'], TEntity['hasManyBy'][TNestedKey]['entity'], TNestedValue>,
	): TypedEntitySelection<TSchema, TEntityName, TEntity, TValue & {
		[key in TAlias extends null ? TNestedKey : TAlias]: null | TNestedValue
	}>

	$<
		TNestedValue extends { [K in string]: unknown },
		TNestedKey extends keyof TEntity['hasOne'] & string,
		TAlias extends string | null = null,
	>(
		name: TNestedKey,
		args: ContentClientInput.HasOneRelationInput<TEntity['hasOne'][TNestedKey]> & { as?: TAlias },
		fields:
			| TypedEntitySelectionCallback<TSchema, TEntity['hasOne'][TNestedKey]['name'], TEntity['hasOne'][TNestedKey], TNestedValue>
			| TypedEntitySelection<TSchema, TEntity['hasOne'][TNestedKey]['name'], TEntity['hasOne'][TNestedKey], TNestedValue>,
	): TypedEntitySelection<TSchema, TEntityName, TEntity, TValue & {
		[key in TAlias extends null ? TNestedKey : TAlias]: TNestedValue | null
	}>

	$<
		TNestedValue extends { [K in string]: unknown },
		TNestedKey extends keyof TEntity['hasOne'] & string,
		TAlias extends string | null = null,
	>(
		name: TNestedKey,
		fields:
			| TypedEntitySelectionCallback<TSchema, TEntity['hasOne'][TNestedKey]['name'], TEntity['hasOne'][TNestedKey], TNestedValue>
			| TypedEntitySelection<TSchema, TEntity['hasOne'][TNestedKey]['name'], TEntity['hasOne'][TNestedKey], TNestedValue>,
	): TypedEntitySelection<TSchema, TEntityName, TEntity, TValue & {
		[key in TAlias extends null ? TNestedKey : TAlias]: TNestedValue | null
	}>
}
