import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql'
export declare type Maybe<T> = T | null
export declare type InputMaybe<T> = Maybe<T>
export declare type Exact<T extends {
	[key: string]: unknown
}> = {
	[K in keyof T]: T[K];
}
export declare type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
	[SubKey in K]?: Maybe<T[SubKey]>;
}
export declare type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
	[SubKey in K]: Maybe<T[SubKey]>;
}
/** All built-in and custom scalars, mapped to their actual values */
export declare type Scalars = {
	ID: string
	String: string
	Boolean: boolean
	Int: number
	Float: number
	DateTime: any
	Json: any
	Uuid: any
}
export declare type Event = {
	readonly __typename?: 'Event'
	readonly createdAt: Scalars['DateTime']
	readonly id: Scalars['Uuid']
	readonly lastStateChange: Scalars['DateTime']
	readonly log: Scalars['Json']
	readonly numRetries: Scalars['Int']
	readonly payload: Scalars['Json']
	readonly resolvedAt?: Maybe<Scalars['DateTime']>
	readonly stage: Scalars['String']
	readonly state?: Maybe<EventState>
	readonly target: Scalars['String']
	readonly transactionId: Scalars['Uuid']
	readonly visibleAt?: Maybe<Scalars['DateTime']>
}
export declare type EventArgs = {
	/** Max 10000 */
	readonly limit?: InputMaybe<Scalars['Int']>
	readonly offset?: InputMaybe<Scalars['Int']>
}
export declare enum EventState {
	Created = 'created',
	Failed = 'failed',
	Processing = 'processing',
	Retrying = 'retrying',
	Stopped = 'stopped',
	Succeed = 'succeed'
}
export declare type Mutation = {
	readonly __typename?: 'Mutation'
	readonly processBatch: ProcessBatchResponse
}
export declare type ProcessBatchResponse = {
	readonly __typename?: 'ProcessBatchResponse'
	readonly ok: Scalars['Boolean']
}
export declare type Query = {
	readonly __typename?: 'Query'
	readonly eventsInProcessing: ReadonlyArray<Event>
	readonly eventsToProcess: ReadonlyArray<Event>
	readonly failedEvents: ReadonlyArray<Event>
}
export declare type QueryEventsInProcessingArgs = {
	args?: InputMaybe<EventArgs>
}
export declare type QueryEventsToProcessArgs = {
	args?: InputMaybe<EventArgs>
}
export declare type QueryFailedEventsArgs = {
	args?: InputMaybe<EventArgs>
}
export declare type ResolverTypeWrapper<T> = Promise<T> | T
export declare type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
	resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}
export declare type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>
export declare type ResolverFn<TResult, TParent, TContext, TArgs> = (parent: TParent, args: TArgs, context: TContext, info: GraphQLResolveInfo) => Promise<TResult> | TResult
export declare type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (parent: TParent, args: TArgs, context: TContext, info: GraphQLResolveInfo) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>
export declare type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (parent: TParent, args: TArgs, context: TContext, info: GraphQLResolveInfo) => TResult | Promise<TResult>
export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
	subscribe: SubscriptionSubscribeFn<{
		[key in TKey]: TResult;
	}, TParent, TContext, TArgs>
	resolve?: SubscriptionResolveFn<TResult, {
		[key in TKey]: TResult;
	}, TContext, TArgs>
}
export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
	subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>
	resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>
}
export declare type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> = SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs> | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>
export declare type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> = ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>) | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>
export declare type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (parent: TParent, context: TContext, info: GraphQLResolveInfo) => Maybe<TTypes> | Promise<Maybe<TTypes>>
export declare type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>
export declare type NextResolverFn<T> = () => Promise<T>
export declare type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (next: NextResolverFn<TResult>, parent: TParent, args: TArgs, context: TContext, info: GraphQLResolveInfo) => TResult | Promise<TResult>
/** Mapping between all available schema types and the resolvers types */
export declare type ResolversTypes = {
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
export declare type ResolversParentTypes = {
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
export declare type EventResolvers<ContextType = any, ParentType extends ResolversParentTypes['Event'] = ResolversParentTypes['Event']> = {
	createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	id?: Resolver<ResolversTypes['Uuid'], ParentType, ContextType>
	lastStateChange?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	log?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	numRetries?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
	payload?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	resolvedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>
	stage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	state?: Resolver<Maybe<ResolversTypes['EventState']>, ParentType, ContextType>
	target?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	transactionId?: Resolver<ResolversTypes['Uuid'], ParentType, ContextType>
	visibleAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}
export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Json'], any> {
	name: 'Json'
}
export declare type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
	processBatch?: Resolver<ResolversTypes['ProcessBatchResponse'], ParentType, ContextType>
}
export declare type ProcessBatchResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProcessBatchResponse'] = ResolversParentTypes['ProcessBatchResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}
export declare type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
	eventsInProcessing?: Resolver<ReadonlyArray<ResolversTypes['Event']>, ParentType, ContextType, Partial<QueryEventsInProcessingArgs>>
	eventsToProcess?: Resolver<ReadonlyArray<ResolversTypes['Event']>, ParentType, ContextType, Partial<QueryEventsToProcessArgs>>
	failedEvents?: Resolver<ReadonlyArray<ResolversTypes['Event']>, ParentType, ContextType, Partial<QueryFailedEventsArgs>>
}
export interface UuidScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Uuid'], any> {
	name: 'Uuid'
}
export declare type Resolvers<ContextType = any> = {
	DateTime?: GraphQLScalarType
	Event?: EventResolvers<ContextType>
	Json?: GraphQLScalarType
	Mutation?: MutationResolvers<ContextType>
	ProcessBatchResponse?: ProcessBatchResponseResolvers<ContextType>
	Query?: QueryResolvers<ContextType>
	Uuid?: GraphQLScalarType
}
//# sourceMappingURL=index.d.ts.map
