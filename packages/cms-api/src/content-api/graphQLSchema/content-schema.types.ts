type Maybe<T> = T | null
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: string
	String: string
	Boolean: boolean
	Int: number
	Float: number
}

export type _AnyValue = _IntValue | _StringValue | _BooleanValue | _FloatValue | _UndefinedValue

export type _Argument = _ValidatorArgument | _PathArgument | _LiteralArgument

export type _BooleanValue = {
	readonly booleanValue: Scalars['Boolean']
}

export type _Entity = {
	readonly name: Scalars['String']
	readonly fields: ReadonlyArray<_Field>
}

export type _Enum = {
	readonly name: Scalars['String']
	readonly values: ReadonlyArray<Scalars['String']>
}

export type _Field = {
	readonly name: Scalars['String']
	readonly rules: ReadonlyArray<_Rule>
	readonly validators: ReadonlyArray<_Validator>
}

export type _FloatValue = {
	readonly floatValue: Scalars['Float']
}

export type _IntValue = {
	readonly intValue: Scalars['Int']
}

export type _LiteralArgument = {
	readonly value?: Maybe<_AnyValue>
}

export type _PathArgument = {
	readonly path: ReadonlyArray<Scalars['String']>
}

export type _Rule = {
	readonly message?: Maybe<_RuleMessage>
	readonly validator: Scalars['Int']
}

export type _RuleMessage = {
	readonly text?: Maybe<Scalars['String']>
}

export type _Schema = {
	readonly enums: ReadonlyArray<_Enum>
	readonly entities: ReadonlyArray<_Entity>
}

export type _StringValue = {
	readonly stringValue: Scalars['String']
}

export type _UndefinedValue = {
	readonly undefinedValue: Scalars['Boolean']
}

export type _Validator = {
	readonly operation: Scalars['String']
	readonly arguments: ReadonlyArray<_Argument>
}

export type _ValidatorArgument = {
	readonly validator: Scalars['Int']
}

export type Query = {
	readonly schema?: Maybe<_Schema>
}

import { GraphQLResolveInfo } from 'graphql'

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo,
) => Promise<TResult> | TResult

export type StitchingResolver<TResult, TParent, TContext, TArgs> = {
	fragment: string
	resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}

export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
	| ResolverFn<TResult, TParent, TContext, TArgs>
	| StitchingResolver<TResult, TParent, TContext, TArgs>

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

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
	subscribe: SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs>
	resolve?: SubscriptionResolveFn<TResult, TParent, TContext, TArgs>
}

export type SubscriptionResolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
	| ((...args: any[]) => SubscriptionResolverObject<TResult, TParent, TContext, TArgs>)
	| SubscriptionResolverObject<TResult, TParent, TContext, TArgs>

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
	parent: TParent,
	context: TContext,
	info: GraphQLResolveInfo,
) => Maybe<TTypes>

export type NextResolverFn<T> = () => Promise<T>

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
	next: NextResolverFn<TResult>,
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo,
) => TResult | Promise<TResult>

export type _AnyValueResolvers<Context = any, ParentType = _AnyValue> = {
	__resolveType: TypeResolveFn<
		'_IntValue' | '_StringValue' | '_BooleanValue' | '_FloatValue' | '_UndefinedValue',
		ParentType,
		Context
	>
}

export type _ArgumentResolvers<Context = any, ParentType = _Argument> = {
	__resolveType: TypeResolveFn<'_ValidatorArgument' | '_PathArgument' | '_LiteralArgument', ParentType, Context>
}

export type _BooleanValueResolvers<Context = any, ParentType = _BooleanValue> = {
	booleanValue?: Resolver<Scalars['Boolean'], ParentType, Context>
}

export type _EntityResolvers<Context = any, ParentType = _Entity> = {
	name?: Resolver<Scalars['String'], ParentType, Context>
	fields?: Resolver<ReadonlyArray<_Field>, ParentType, Context>
}

export type _EnumResolvers<Context = any, ParentType = _Enum> = {
	name?: Resolver<Scalars['String'], ParentType, Context>
	values?: Resolver<ReadonlyArray<Scalars['String']>, ParentType, Context>
}

export type _FieldResolvers<Context = any, ParentType = _Field> = {
	name?: Resolver<Scalars['String'], ParentType, Context>
	rules?: Resolver<ReadonlyArray<_Rule>, ParentType, Context>
	validators?: Resolver<ReadonlyArray<_Validator>, ParentType, Context>
}

export type _FloatValueResolvers<Context = any, ParentType = _FloatValue> = {
	floatValue?: Resolver<Scalars['Float'], ParentType, Context>
}

export type _IntValueResolvers<Context = any, ParentType = _IntValue> = {
	intValue?: Resolver<Scalars['Int'], ParentType, Context>
}

export type _LiteralArgumentResolvers<Context = any, ParentType = _LiteralArgument> = {
	value?: Resolver<Maybe<_AnyValue>, ParentType, Context>
}

export type _PathArgumentResolvers<Context = any, ParentType = _PathArgument> = {
	path?: Resolver<ReadonlyArray<Scalars['String']>, ParentType, Context>
}

export type _RuleResolvers<Context = any, ParentType = _Rule> = {
	message?: Resolver<Maybe<_RuleMessage>, ParentType, Context>
	validator?: Resolver<Scalars['Int'], ParentType, Context>
}

export type _RuleMessageResolvers<Context = any, ParentType = _RuleMessage> = {
	text?: Resolver<Maybe<Scalars['String']>, ParentType, Context>
}

export type _SchemaResolvers<Context = any, ParentType = _Schema> = {
	enums?: Resolver<ReadonlyArray<_Enum>, ParentType, Context>
	entities?: Resolver<ReadonlyArray<_Entity>, ParentType, Context>
}

export type _StringValueResolvers<Context = any, ParentType = _StringValue> = {
	stringValue?: Resolver<Scalars['String'], ParentType, Context>
}

export type _UndefinedValueResolvers<Context = any, ParentType = _UndefinedValue> = {
	undefinedValue?: Resolver<Scalars['Boolean'], ParentType, Context>
}

export type _ValidatorResolvers<Context = any, ParentType = _Validator> = {
	operation?: Resolver<Scalars['String'], ParentType, Context>
	arguments?: Resolver<ReadonlyArray<_Argument>, ParentType, Context>
}

export type _ValidatorArgumentResolvers<Context = any, ParentType = _ValidatorArgument> = {
	validator?: Resolver<Scalars['Int'], ParentType, Context>
}

export type QueryResolvers<Context = any, ParentType = Query> = {
	schema?: Resolver<Maybe<_Schema>, ParentType, Context>
}

export type Resolvers<Context = any> = {
	_AnyValue?: _AnyValueResolvers
	_Argument?: _ArgumentResolvers
	_BooleanValue?: _BooleanValueResolvers<Context>
	_Entity?: _EntityResolvers<Context>
	_Enum?: _EnumResolvers<Context>
	_Field?: _FieldResolvers<Context>
	_FloatValue?: _FloatValueResolvers<Context>
	_IntValue?: _IntValueResolvers<Context>
	_LiteralArgument?: _LiteralArgumentResolvers<Context>
	_PathArgument?: _PathArgumentResolvers<Context>
	_Rule?: _RuleResolvers<Context>
	_RuleMessage?: _RuleMessageResolvers<Context>
	_Schema?: _SchemaResolvers<Context>
	_StringValue?: _StringValueResolvers<Context>
	_UndefinedValue?: _UndefinedValueResolvers<Context>
	_Validator?: _ValidatorResolvers<Context>
	_ValidatorArgument?: _ValidatorArgumentResolvers<Context>
	Query?: QueryResolvers<Context>
}

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<Context = any> = Resolvers<Context>
