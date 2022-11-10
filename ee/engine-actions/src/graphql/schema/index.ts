import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: string
	String: string
	Boolean: boolean
	Int: number
	Float: number
	DateTime: Date
	Json: any
	Uuid: String
}

export type Event = {
	readonly __typename?: 'Event'
	readonly createdAt: Scalars['DateTime']
	readonly id: Scalars['Uuid']
	readonly lastStateChange: Scalars['DateTime']
	readonly log: Scalars['Json']
	readonly numRetries: Scalars['Int']
	readonly payload: Scalars['Json']
	readonly resolvedAt?: Maybe<Scalars['DateTime']>
	readonly stage: Scalars['String']
	readonly state: EventState
	readonly target: Scalars['String']
	readonly transactionId: Scalars['Uuid']
	readonly visibleAt?: Maybe<Scalars['DateTime']>
}

export type EventArgs = {
	/** Max 10000 */
	readonly limit?: InputMaybe<Scalars['Int']>
	readonly offset?: InputMaybe<Scalars['Int']>
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
}

export type ProcessBatchResponse = {
	readonly __typename?: 'ProcessBatchResponse'
	readonly ok: Scalars['Boolean']
}

export type Query = {
	readonly __typename?: 'Query'
	readonly eventsInProcessing: ReadonlyArray<Event>
	readonly eventsToProcess: ReadonlyArray<Event>
	readonly failedEvents: ReadonlyArray<Event>
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
	Boolean: ResolverTypeWrapper<Scalars['Boolean']>
	DateTime: ResolverTypeWrapper<Scalars['DateTime']>
	Event: ResolverTypeWrapper<Event>
	EventArgs: EventArgs
	EventState: EventState
	Int: ResolverTypeWrapper<Scalars['Int']>
	Json: ResolverTypeWrapper<Scalars['Json']>
	Mutation: ResolverTypeWrapper<{}>
	ProcessBatchResponse: ResolverTypeWrapper<ProcessBatchResponse>
	Query: ResolverTypeWrapper<{}>
	String: ResolverTypeWrapper<Scalars['String']>
	Uuid: ResolverTypeWrapper<Scalars['Uuid']>
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
	Boolean: Scalars['Boolean']
	DateTime: Scalars['DateTime']
	Event: Event
	EventArgs: EventArgs
	Int: Scalars['Int']
	Json: Scalars['Json']
	Mutation: {}
	ProcessBatchResponse: ProcessBatchResponse
	Query: {}
	String: Scalars['String']
	Uuid: Scalars['Uuid']
}

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
	name: 'DateTime'
}

export type EventResolvers<ContextType = any, ParentType extends ResolversParentTypes['Event'] = ResolversParentTypes['Event']> = {
	createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	id?: Resolver<ResolversTypes['Uuid'], ParentType, ContextType>
	lastStateChange?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	log?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	numRetries?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
	payload?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	resolvedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>
	stage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	state?: Resolver<ResolversTypes['EventState'], ParentType, ContextType>
	target?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	transactionId?: Resolver<ResolversTypes['Uuid'], ParentType, ContextType>
	visibleAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Json'], any> {
	name: 'Json'
}

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
	processBatch?: Resolver<ResolversTypes['ProcessBatchResponse'], ParentType, ContextType>
}

export type ProcessBatchResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProcessBatchResponse'] = ResolversParentTypes['ProcessBatchResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
	eventsInProcessing?: Resolver<ReadonlyArray<ResolversTypes['Event']>, ParentType, ContextType, Partial<QueryEventsInProcessingArgs>>
	eventsToProcess?: Resolver<ReadonlyArray<ResolversTypes['Event']>, ParentType, ContextType, Partial<QueryEventsToProcessArgs>>
	failedEvents?: Resolver<ReadonlyArray<ResolversTypes['Event']>, ParentType, ContextType, Partial<QueryFailedEventsArgs>>
}

export interface UuidScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Uuid'], any> {
	name: 'Uuid'
}

export type Resolvers<ContextType = any> = {
	DateTime?: GraphQLScalarType
	Event?: EventResolvers<ContextType>
	Json?: GraphQLScalarType
	Mutation?: MutationResolvers<ContextType>
	ProcessBatchResponse?: ProcessBatchResponseResolvers<ContextType>
	Query?: QueryResolvers<ContextType>
	Uuid?: GraphQLScalarType
}

