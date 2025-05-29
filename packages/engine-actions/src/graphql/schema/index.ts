import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never }
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never }
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: { input: string; output: string }
	String: { input: string; output: string }
	Boolean: { input: boolean; output: boolean }
	Int: { input: number; output: number }
	Float: { input: number; output: number }
	DateTime: { input: Date; output: Date }
	Json: { input: any; output: any }
	Uuid: { input: string; output: string }
}

export type Event = {
	readonly __typename?: 'Event'
	readonly createdAt: Scalars['DateTime']['output']
	readonly id: Scalars['Uuid']['output']
	readonly identityId?: Maybe<Scalars['Uuid']['output']>
	readonly ipAddress?: Maybe<Scalars['String']['output']>
	readonly lastStateChange: Scalars['DateTime']['output']
	readonly log: Scalars['Json']['output']
	readonly numRetries: Scalars['Int']['output']
	readonly payload: Scalars['Json']['output']
	readonly resolvedAt?: Maybe<Scalars['DateTime']['output']>
	readonly stage: Scalars['String']['output']
	readonly state: EventState
	readonly target: Scalars['String']['output']
	readonly transactionId: Scalars['Uuid']['output']
	readonly userAgent?: Maybe<Scalars['String']['output']>
	readonly visibleAt?: Maybe<Scalars['DateTime']['output']>
}

export type EventArgs = {
	/** Max 10000 */
	readonly limit?: InputMaybe<Scalars['Int']['input']>
	readonly offset?: InputMaybe<Scalars['Int']['input']>
}

export type EventState =
  | 'created'
  | 'failed'
  | 'processing'
  | 'retrying'
  | 'stopped'
  | 'succeed'

export type Mutation = {
	readonly __typename?: 'Mutation'
	readonly processBatch: ProcessBatchResponse
	readonly retryEvent: RetryEventResponse
	readonly setVariables: SetVariablesResponse
	readonly stopEvent: StopEventResponse
}


export type MutationRetryEventArgs = {
	id: Scalars['Uuid']['input']
}


export type MutationSetVariablesArgs = {
	args: SetVariablesArgs
}


export type MutationStopEventArgs = {
	id: Scalars['Uuid']['input']
}

export type ProcessBatchResponse = {
	readonly __typename?: 'ProcessBatchResponse'
	readonly ok: Scalars['Boolean']['output']
}

export type Query = {
	readonly __typename?: 'Query'
	readonly event?: Maybe<Event>
	readonly eventsInProcessing: ReadonlyArray<Event>
	readonly eventsToProcess: ReadonlyArray<Event>
	readonly failedEvents: ReadonlyArray<Event>
	readonly variables: ReadonlyArray<Variable>
}


export type QueryEventArgs = {
	id: Scalars['Uuid']['input']
}


export type QueryEventsInProcessingArgs = {
	args?: InputMaybe<EventArgs>
}


export type QueryEventsToProcessArgs = {
	args?: InputMaybe<EventArgs>
}


export type QueryFailedEventsArgs = {
	args?: InputMaybe<EventArgs>
}

export type RetryEventResponse = {
	readonly __typename?: 'RetryEventResponse'
	readonly ok: Scalars['Boolean']['output']
}

export type SetVariablesArgs = {
	readonly mode?: InputMaybe<SetVariablesMode>
	readonly variables: ReadonlyArray<VariableInput>
}

/**
 * Defines how it handles original variables.
 * - MERGE merges with new values (default behaviour)
 * - SET replaces all variables
 * - APPEND_ONLY_MISSING appends values if not already exist
 */
export type SetVariablesMode =
  | 'APPEND_ONLY_MISSING'
  | 'MERGE'
  | 'SET'

export type SetVariablesResponse = {
	readonly __typename?: 'SetVariablesResponse'
	readonly ok: Scalars['Boolean']['output']
}

export type StopEventResponse = {
	readonly __typename?: 'StopEventResponse'
	readonly ok: Scalars['Boolean']['output']
}

export type Variable = {
	readonly __typename?: 'Variable'
	readonly name: Scalars['String']['output']
	readonly value: Scalars['String']['output']
}

export type VariableInput = {
	readonly name: Scalars['String']['input']
	readonly value: Scalars['String']['input']
}



export type ResolverTypeWrapper<T> = Promise<T> | T


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
	resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo
) => Promise<TResult> | TResult

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo
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
	info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>

export type NextResolverFn<T> = () => Promise<T>

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
	next: NextResolverFn<TResult>,
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo
) => TResult | Promise<TResult>



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
	Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>
	DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>
	Event: ResolverTypeWrapper<Event>
	EventArgs: EventArgs
	EventState: EventState
	Int: ResolverTypeWrapper<Scalars['Int']['output']>
	Json: ResolverTypeWrapper<Scalars['Json']['output']>
	Mutation: ResolverTypeWrapper<{}>
	ProcessBatchResponse: ResolverTypeWrapper<ProcessBatchResponse>
	Query: ResolverTypeWrapper<{}>
	RetryEventResponse: ResolverTypeWrapper<RetryEventResponse>
	SetVariablesArgs: SetVariablesArgs
	SetVariablesMode: SetVariablesMode
	SetVariablesResponse: ResolverTypeWrapper<SetVariablesResponse>
	StopEventResponse: ResolverTypeWrapper<StopEventResponse>
	String: ResolverTypeWrapper<Scalars['String']['output']>
	Uuid: ResolverTypeWrapper<Scalars['Uuid']['output']>
	Variable: ResolverTypeWrapper<Variable>
	VariableInput: VariableInput
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
	Boolean: Scalars['Boolean']['output']
	DateTime: Scalars['DateTime']['output']
	Event: Event
	EventArgs: EventArgs
	Int: Scalars['Int']['output']
	Json: Scalars['Json']['output']
	Mutation: {}
	ProcessBatchResponse: ProcessBatchResponse
	Query: {}
	RetryEventResponse: RetryEventResponse
	SetVariablesArgs: SetVariablesArgs
	SetVariablesResponse: SetVariablesResponse
	StopEventResponse: StopEventResponse
	String: Scalars['String']['output']
	Uuid: Scalars['Uuid']['output']
	Variable: Variable
	VariableInput: VariableInput
}

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
	name: 'DateTime'
}

export type EventResolvers<ContextType = any, ParentType extends ResolversParentTypes['Event'] = ResolversParentTypes['Event']> = {
	createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	id?: Resolver<ResolversTypes['Uuid'], ParentType, ContextType>
	identityId?: Resolver<Maybe<ResolversTypes['Uuid']>, ParentType, ContextType>
	ipAddress?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	lastStateChange?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	log?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	numRetries?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
	payload?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	resolvedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>
	stage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	state?: Resolver<ResolversTypes['EventState'], ParentType, ContextType>
	target?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	transactionId?: Resolver<ResolversTypes['Uuid'], ParentType, ContextType>
	userAgent?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	visibleAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Json'], any> {
	name: 'Json'
}

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
	processBatch?: Resolver<ResolversTypes['ProcessBatchResponse'], ParentType, ContextType>
	retryEvent?: Resolver<ResolversTypes['RetryEventResponse'], ParentType, ContextType, RequireFields<MutationRetryEventArgs, 'id'>>
	setVariables?: Resolver<ResolversTypes['SetVariablesResponse'], ParentType, ContextType, RequireFields<MutationSetVariablesArgs, 'args'>>
	stopEvent?: Resolver<ResolversTypes['StopEventResponse'], ParentType, ContextType, RequireFields<MutationStopEventArgs, 'id'>>
}

export type ProcessBatchResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProcessBatchResponse'] = ResolversParentTypes['ProcessBatchResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
	event?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<QueryEventArgs, 'id'>>
	eventsInProcessing?: Resolver<ReadonlyArray<ResolversTypes['Event']>, ParentType, ContextType, Partial<QueryEventsInProcessingArgs>>
	eventsToProcess?: Resolver<ReadonlyArray<ResolversTypes['Event']>, ParentType, ContextType, Partial<QueryEventsToProcessArgs>>
	failedEvents?: Resolver<ReadonlyArray<ResolversTypes['Event']>, ParentType, ContextType, Partial<QueryFailedEventsArgs>>
	variables?: Resolver<ReadonlyArray<ResolversTypes['Variable']>, ParentType, ContextType>
}

export type RetryEventResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['RetryEventResponse'] = ResolversParentTypes['RetryEventResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SetVariablesResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['SetVariablesResponse'] = ResolversParentTypes['SetVariablesResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type StopEventResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['StopEventResponse'] = ResolversParentTypes['StopEventResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export interface UuidScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Uuid'], any> {
	name: 'Uuid'
}

export type VariableResolvers<ContextType = any, ParentType extends ResolversParentTypes['Variable'] = ResolversParentTypes['Variable']> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	value?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type Resolvers<ContextType = any> = {
	DateTime?: GraphQLScalarType
	Event?: EventResolvers<ContextType>
	Json?: GraphQLScalarType
	Mutation?: MutationResolvers<ContextType>
	ProcessBatchResponse?: ProcessBatchResponseResolvers<ContextType>
	Query?: QueryResolvers<ContextType>
	RetryEventResponse?: RetryEventResponseResolvers<ContextType>
	SetVariablesResponse?: SetVariablesResponseResolvers<ContextType>
	StopEventResponse?: StopEventResponseResolvers<ContextType>
	Uuid?: GraphQLScalarType
	Variable?: VariableResolvers<ContextType>
}

