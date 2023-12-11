import { ContentClientInput, MutationResult, SchemaTypeLike, TransactionResult } from './types'
import { ContentMutation, ContentQuery, TypedEntitySelection, TypedEntitySelectionCallback } from './nodes'
import { MutationTransactionOptions } from './ContentQueryBuilder'


export type TypedContentEntitySelectionOrCallback<TSchema extends SchemaTypeLike, TEntityName extends keyof TSchema['entities'] & string, TValue> =
	| TypedEntitySelection<TSchema, TEntityName, TSchema['entities'][TEntityName], TValue>
	| TypedEntitySelectionCallback<TSchema, TEntityName, TSchema['entities'][TEntityName], TValue>


export interface TypedContentQueryBuilder<TSchema extends SchemaTypeLike> {

	fragment<EntityName extends keyof TSchema['entities'] & string>(
		name: EntityName,
	): TypedEntitySelection<TSchema, EntityName, TSchema['entities'][EntityName], {}>
	fragment<EntityName extends keyof TSchema['entities'] & string, TFields>(
		name: EntityName,
		fieldsCallback: TypedEntitySelectionCallback<TSchema, EntityName, TSchema['entities'][EntityName], TFields>,
	): TypedEntitySelection<TSchema, EntityName, TSchema['entities'][EntityName], TFields>

	count<EntityName extends keyof TSchema['entities'] & string>(
		name: EntityName,
		args: Pick<ContentClientInput.ListQueryInput<TSchema['entities'][EntityName]>, 'filter'>,
	): ContentQuery<number>

	list<EntityName extends keyof TSchema['entities'] & string, TValue>(
		name: EntityName,
		args: ContentClientInput.ListQueryInput<TSchema['entities'][EntityName]>,
		fields: TypedContentEntitySelectionOrCallback<TSchema, EntityName, TValue>,
	): ContentQuery<TValue[]>

	get<EntityName extends keyof TSchema['entities'] & string, TValue>(
		name: EntityName,
		args: ContentClientInput.UniqueQueryInput<TSchema['entities'][EntityName]>,
		fields: TypedContentEntitySelectionOrCallback<TSchema, EntityName, TValue>,
	): ContentQuery<TValue | null>

	create<EntityName extends keyof TSchema['entities'] & string, TValue>(
		name: EntityName,
		args: ContentClientInput.CreateInput<TSchema['entities'][EntityName]>,
		fields?: TypedContentEntitySelectionOrCallback<TSchema, EntityName, TValue>,
	): ContentMutation<MutationResult<TValue>>

	update<EntityName extends keyof TSchema['entities'] & string, TValue>(
		name: EntityName,
		args: ContentClientInput.UpdateInput<TSchema['entities'][EntityName]>,
		fields?: TypedContentEntitySelectionOrCallback<TSchema, EntityName, TValue>,
	): ContentMutation<MutationResult<TValue>>

	upsert<EntityName extends keyof TSchema['entities'] & string, TValue>(
		name: EntityName,
		args: ContentClientInput.UpsertInput<TSchema['entities'][EntityName]>,
		fields?: TypedContentEntitySelectionOrCallback<TSchema, EntityName, TValue>,
	): ContentMutation<MutationResult<TValue>>

	delete<EntityName extends keyof TSchema['entities'] & string, TValue>(
		name: EntityName,
		args: ContentClientInput.UniqueQueryInput<TSchema['entities'][EntityName]>,
		fields?: TypedContentEntitySelectionOrCallback<TSchema, EntityName, TValue>,
	): ContentMutation<MutationResult<TValue>>

	transaction<Value>(
		mutation: ContentMutation<Value>,
		options?: MutationTransactionOptions,
	): ContentMutation<TransactionResult<Value>>
	transaction<Value>(
		mutations: ContentMutation<Value>[],
		options?: MutationTransactionOptions,
	): ContentMutation<TransactionResult<Value[]>>

	transaction<Values extends Record<string, any>>(
		mutations: { [K in keyof Values]: ContentMutation<Values[K]> | ContentQuery<Values[K]> },
		options?: MutationTransactionOptions,
	): ContentMutation<TransactionResult<Values>>
}

