import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql'
export type Maybe<T> = T | null
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: string
	String: string
	Boolean: boolean
	Int: number
	Float: number
	Json: any
}

export type Query = {
	readonly __typename?: 'Query'
	readonly schema?: Maybe<_Schema>
}

export type _Argument = _ValidatorArgument | _PathArgument | _LiteralArgument

export type _Column = _Field & {
	readonly __typename?: '_Column'
	readonly name: Scalars['String']
	readonly type: Scalars['String']
	readonly enumName?: Maybe<Scalars['String']>
	readonly defaultValue?: Maybe<Scalars['Json']>
	readonly nullable: Scalars['Boolean']
	readonly rules: ReadonlyArray<_Rule>
	readonly validators: ReadonlyArray<_Validator>
}

export type _Entity = {
	readonly __typename?: '_Entity'
	readonly name: Scalars['String']
	readonly customPrimaryAllowed: Scalars['Boolean']
	readonly fields: ReadonlyArray<_Field>
	readonly unique: ReadonlyArray<_UniqueConstraint>
}

export type _Enum = {
	readonly __typename?: '_Enum'
	readonly name: Scalars['String']
	readonly values: ReadonlyArray<Scalars['String']>
}

export type _Field = {
	readonly name: Scalars['String']
	readonly type: Scalars['String']
	readonly nullable?: Maybe<Scalars['Boolean']>
	readonly rules: ReadonlyArray<_Rule>
	readonly validators: ReadonlyArray<_Validator>
}

export type _LiteralArgument = {
	readonly __typename?: '_LiteralArgument'
	readonly value?: Maybe<Scalars['Json']>
}

export enum _OnDeleteBehaviour {
	Restrict = 'restrict',
	Cascade = 'cascade',
	SetNull = 'setNull',
}

export type _OrderBy = {
	readonly __typename?: '_OrderBy'
	readonly path: ReadonlyArray<Scalars['String']>
	readonly direction: _OrderByDirection
}

export enum _OrderByDirection {
	Asc = 'asc',
	Desc = 'desc',
}

export type _PathArgument = {
	readonly __typename?: '_PathArgument'
	readonly path: ReadonlyArray<Scalars['String']>
}

export type _Relation = _Field & {
	readonly __typename?: '_Relation'
	readonly name: Scalars['String']
	readonly type: Scalars['String']
	readonly side: _RelationSide
	readonly targetEntity: Scalars['String']
	readonly ownedBy?: Maybe<Scalars['String']>
	readonly inversedBy?: Maybe<Scalars['String']>
	readonly nullable?: Maybe<Scalars['Boolean']>
	readonly onDelete?: Maybe<_OnDeleteBehaviour>
	readonly orphanRemoval?: Maybe<Scalars['Boolean']>
	readonly orderBy?: Maybe<ReadonlyArray<_OrderBy>>
	readonly rules: ReadonlyArray<_Rule>
	readonly validators: ReadonlyArray<_Validator>
}

export enum _RelationSide {
	Owning = 'owning',
	Inverse = 'inverse',
}

export type _Rule = {
	readonly __typename?: '_Rule'
	readonly message?: Maybe<_RuleMessage>
	readonly validator: Scalars['Int']
}

export type _RuleMessage = {
	readonly __typename?: '_RuleMessage'
	readonly text?: Maybe<Scalars['String']>
}

export type _Schema = {
	readonly __typename?: '_Schema'
	readonly enums: ReadonlyArray<_Enum>
	readonly entities: ReadonlyArray<_Entity>
}

export type _UniqueConstraint = {
	readonly __typename?: '_UniqueConstraint'
	readonly fields: ReadonlyArray<Scalars['String']>
}

export type _Validator = {
	readonly __typename?: '_Validator'
	readonly operation: Scalars['String']
	readonly arguments: ReadonlyArray<_Argument>
}

export type _ValidatorArgument = {
	readonly __typename?: '_ValidatorArgument'
	readonly validator: Scalars['Int']
}

export type ResolverTypeWrapper<T> = Promise<T> | T

export type LegacyStitchingResolver<TResult, TParent, TContext, TArgs> = {
	fragment: string
	resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}

export type NewStitchingResolver<TResult, TParent, TContext, TArgs> = {
	selectionSet: string
	resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}
export type StitchingResolver<TResult, TParent, TContext, TArgs> =
	| LegacyStitchingResolver<TResult, TParent, TContext, TArgs>
	| NewStitchingResolver<TResult, TParent, TContext, TArgs>
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
	| ResolverFn<TResult, TParent, TContext, TArgs>
	| StitchingResolver<TResult, TParent, TContext, TArgs>

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo,
) => Promise<TResult> | TResult

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo,
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo,
) => TResult | Promise<TResult>

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
	subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>
	resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
	subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>
	resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
	| SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
	| SubscriptionResolverObject<TResult, TParent, TContext, TArgs>

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
	| ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
	| SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
	parent: TParent,
	context: TContext,
	info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
	obj: T,
	context: TContext,
	info: GraphQLResolveInfo,
) => boolean | Promise<boolean>

export type NextResolverFn<T> = () => Promise<T>

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
	next: NextResolverFn<TResult>,
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo,
) => TResult | Promise<TResult>

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
	Json: ResolverTypeWrapper<Scalars['Json']>
	Query: ResolverTypeWrapper<{}>
	_Argument: ResolversTypes['_ValidatorArgument'] | ResolversTypes['_PathArgument'] | ResolversTypes['_LiteralArgument']
	_Column: ResolverTypeWrapper<_Column>
	String: ResolverTypeWrapper<Scalars['String']>
	Boolean: ResolverTypeWrapper<Scalars['Boolean']>
	_Entity: ResolverTypeWrapper<_Entity>
	_Enum: ResolverTypeWrapper<_Enum>
	_Field: ResolversTypes['_Column'] | ResolversTypes['_Relation']
	_LiteralArgument: ResolverTypeWrapper<_LiteralArgument>
	_OnDeleteBehaviour: _OnDeleteBehaviour
	_OrderBy: ResolverTypeWrapper<_OrderBy>
	_OrderByDirection: _OrderByDirection
	_PathArgument: ResolverTypeWrapper<_PathArgument>
	_Relation: ResolverTypeWrapper<_Relation>
	_RelationSide: _RelationSide
	_Rule: ResolverTypeWrapper<_Rule>
	Int: ResolverTypeWrapper<Scalars['Int']>
	_RuleMessage: ResolverTypeWrapper<_RuleMessage>
	_Schema: ResolverTypeWrapper<_Schema>
	_UniqueConstraint: ResolverTypeWrapper<_UniqueConstraint>
	_Validator: ResolverTypeWrapper<
		Omit<_Validator, 'arguments'> & { arguments: ReadonlyArray<ResolversTypes['_Argument']> }
	>
	_ValidatorArgument: ResolverTypeWrapper<_ValidatorArgument>
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
	Json: Scalars['Json']
	Query: {}
	_Argument:
		| ResolversParentTypes['_ValidatorArgument']
		| ResolversParentTypes['_PathArgument']
		| ResolversParentTypes['_LiteralArgument']
	_Column: _Column
	String: Scalars['String']
	Boolean: Scalars['Boolean']
	_Entity: _Entity
	_Enum: _Enum
	_Field: ResolversParentTypes['_Column'] | ResolversParentTypes['_Relation']
	_LiteralArgument: _LiteralArgument
	_OrderBy: _OrderBy
	_PathArgument: _PathArgument
	_Relation: _Relation
	_Rule: _Rule
	Int: Scalars['Int']
	_RuleMessage: _RuleMessage
	_Schema: _Schema
	_UniqueConstraint: _UniqueConstraint
	_Validator: Omit<_Validator, 'arguments'> & { arguments: ReadonlyArray<ResolversParentTypes['_Argument']> }
	_ValidatorArgument: _ValidatorArgument
}

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Json'], any> {
	name: 'Json'
}

export type QueryResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query'],
> = {
	schema?: Resolver<Maybe<ResolversTypes['_Schema']>, ParentType, ContextType>
}

export type _ArgumentResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['_Argument'] = ResolversParentTypes['_Argument'],
> = {
	__resolveType: TypeResolveFn<'_ValidatorArgument' | '_PathArgument' | '_LiteralArgument', ParentType, ContextType>
}

export type _ColumnResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['_Column'] = ResolversParentTypes['_Column'],
> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	type?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	enumName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	defaultValue?: Resolver<Maybe<ResolversTypes['Json']>, ParentType, ContextType>
	nullable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	rules?: Resolver<ReadonlyArray<ResolversTypes['_Rule']>, ParentType, ContextType>
	validators?: Resolver<ReadonlyArray<ResolversTypes['_Validator']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type _EntityResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['_Entity'] = ResolversParentTypes['_Entity'],
> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	customPrimaryAllowed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	fields?: Resolver<ReadonlyArray<ResolversTypes['_Field']>, ParentType, ContextType>
	unique?: Resolver<ReadonlyArray<ResolversTypes['_UniqueConstraint']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type _EnumResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['_Enum'] = ResolversParentTypes['_Enum'],
> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	values?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type _FieldResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['_Field'] = ResolversParentTypes['_Field'],
> = {
	__resolveType: TypeResolveFn<'_Column' | '_Relation', ParentType, ContextType>
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	type?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	nullable?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>
	rules?: Resolver<ReadonlyArray<ResolversTypes['_Rule']>, ParentType, ContextType>
	validators?: Resolver<ReadonlyArray<ResolversTypes['_Validator']>, ParentType, ContextType>
}

export type _LiteralArgumentResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['_LiteralArgument'] = ResolversParentTypes['_LiteralArgument'],
> = {
	value?: Resolver<Maybe<ResolversTypes['Json']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type _OrderByResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['_OrderBy'] = ResolversParentTypes['_OrderBy'],
> = {
	path?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	direction?: Resolver<ResolversTypes['_OrderByDirection'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type _PathArgumentResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['_PathArgument'] = ResolversParentTypes['_PathArgument'],
> = {
	path?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type _RelationResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['_Relation'] = ResolversParentTypes['_Relation'],
> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	type?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	side?: Resolver<ResolversTypes['_RelationSide'], ParentType, ContextType>
	targetEntity?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	ownedBy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	inversedBy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	nullable?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>
	onDelete?: Resolver<Maybe<ResolversTypes['_OnDeleteBehaviour']>, ParentType, ContextType>
	orphanRemoval?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>
	orderBy?: Resolver<Maybe<ReadonlyArray<ResolversTypes['_OrderBy']>>, ParentType, ContextType>
	rules?: Resolver<ReadonlyArray<ResolversTypes['_Rule']>, ParentType, ContextType>
	validators?: Resolver<ReadonlyArray<ResolversTypes['_Validator']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type _RuleResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['_Rule'] = ResolversParentTypes['_Rule'],
> = {
	message?: Resolver<Maybe<ResolversTypes['_RuleMessage']>, ParentType, ContextType>
	validator?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type _RuleMessageResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['_RuleMessage'] = ResolversParentTypes['_RuleMessage'],
> = {
	text?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type _SchemaResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['_Schema'] = ResolversParentTypes['_Schema'],
> = {
	enums?: Resolver<ReadonlyArray<ResolversTypes['_Enum']>, ParentType, ContextType>
	entities?: Resolver<ReadonlyArray<ResolversTypes['_Entity']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type _UniqueConstraintResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['_UniqueConstraint'] = ResolversParentTypes['_UniqueConstraint'],
> = {
	fields?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type _ValidatorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['_Validator'] = ResolversParentTypes['_Validator'],
> = {
	operation?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	arguments?: Resolver<ReadonlyArray<ResolversTypes['_Argument']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type _ValidatorArgumentResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['_ValidatorArgument'] = ResolversParentTypes['_ValidatorArgument'],
> = {
	validator?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type Resolvers<ContextType = any> = {
	Json?: GraphQLScalarType
	Query?: QueryResolvers<ContextType>
	_Argument?: _ArgumentResolvers<ContextType>
	_Column?: _ColumnResolvers<ContextType>
	_Entity?: _EntityResolvers<ContextType>
	_Enum?: _EnumResolvers<ContextType>
	_Field?: _FieldResolvers<ContextType>
	_LiteralArgument?: _LiteralArgumentResolvers<ContextType>
	_OrderBy?: _OrderByResolvers<ContextType>
	_PathArgument?: _PathArgumentResolvers<ContextType>
	_Relation?: _RelationResolvers<ContextType>
	_Rule?: _RuleResolvers<ContextType>
	_RuleMessage?: _RuleMessageResolvers<ContextType>
	_Schema?: _SchemaResolvers<ContextType>
	_UniqueConstraint?: _UniqueConstraintResolvers<ContextType>
	_Validator?: _ValidatorResolvers<ContextType>
	_ValidatorArgument?: _ValidatorArgumentResolvers<ContextType>
}

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = any> = Resolvers<ContextType>
