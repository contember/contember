import { GraphQLResolveInfo } from 'graphql'
export type Maybe<T> = T | null
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } &
	{ [P in K]-?: NonNullable<T[P]> }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: string
	String: string
	Boolean: boolean
	Int: number
	Float: number
}

export type CreateEvent = Event & {
	__typename?: 'CreateEvent'
	readonly id: Scalars['String']
	readonly dependencies: ReadonlyArray<Scalars['String']>
	readonly type?: Maybe<EventType>
	readonly description: Scalars['String']
	readonly allowed: Scalars['Boolean']
	readonly entity: Scalars['String']
	readonly rowId: Scalars['String']
}

export type DeleteEvent = Event & {
	__typename?: 'DeleteEvent'
	readonly id: Scalars['String']
	readonly dependencies: ReadonlyArray<Scalars['String']>
	readonly type?: Maybe<EventType>
	readonly description: Scalars['String']
	readonly allowed: Scalars['Boolean']
	readonly entity: Scalars['String']
	readonly rowId: Scalars['String']
}

export enum DiffErrorCode {
	BaseNotFound = 'BASE_NOT_FOUND',
	HeadNotFound = 'HEAD_NOT_FOUND',
	NotRebased = 'NOT_REBASED',
}

export type DiffFilter = {
	readonly entity: Scalars['String']
	readonly id: Scalars['String']
}

export type DiffResponse = {
	__typename?: 'DiffResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<DiffErrorCode>
	readonly result?: Maybe<DiffResult>
}

export type DiffResult = {
	__typename?: 'DiffResult'
	readonly base: Stage
	readonly head: Stage
	readonly events: ReadonlyArray<Event>
}

export type Event = {
	readonly id: Scalars['String']
	readonly dependencies: ReadonlyArray<Scalars['String']>
	readonly description: Scalars['String']
	readonly allowed: Scalars['Boolean']
	readonly type?: Maybe<EventType>
}

export enum EventType {
	Update = 'UPDATE',
	Delete = 'DELETE',
	Create = 'CREATE',
	RunMigration = 'RUN_MIGRATION',
}

export type Mutation = {
	__typename?: 'Mutation'
	readonly release: ReleaseResponse
	readonly rebaseAll: RebaseAllResponse
}

export type MutationReleaseArgs = {
	baseStage: Scalars['String']
	headStage: Scalars['String']
	events: ReadonlyArray<Scalars['String']>
}

export type Query = {
	__typename?: 'Query'
	readonly stages: ReadonlyArray<Stage>
	readonly diff: DiffResponse
}

export type QueryDiffArgs = {
	baseStage: Scalars['String']
	headStage: Scalars['String']
	filter?: Maybe<ReadonlyArray<DiffFilter>>
}

export type RebaseAllResponse = {
	__typename?: 'RebaseAllResponse'
	readonly ok: Scalars['Boolean']
}

export enum ReleaseErrorCode {
	MissingDependency = 'MISSING_DEPENDENCY',
	Forbidden = 'FORBIDDEN',
}

export type ReleaseResponse = {
	__typename?: 'ReleaseResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<ReleaseErrorCode>
}

export type RunMigrationEvent = Event & {
	__typename?: 'RunMigrationEvent'
	readonly id: Scalars['String']
	readonly dependencies: ReadonlyArray<Scalars['String']>
	readonly type?: Maybe<EventType>
	readonly description: Scalars['String']
	readonly allowed: Scalars['Boolean']
	readonly version: Scalars['String']
}

export type Stage = {
	__typename?: 'Stage'
	readonly id: Scalars['String']
	readonly name: Scalars['String']
	readonly slug: Scalars['String']
}

export type UpdateEvent = Event & {
	__typename?: 'UpdateEvent'
	readonly id: Scalars['String']
	readonly dependencies: ReadonlyArray<Scalars['String']>
	readonly type?: Maybe<EventType>
	readonly description: Scalars['String']
	readonly allowed: Scalars['Boolean']
	readonly entity: Scalars['String']
	readonly rowId: Scalars['String']
	readonly fields: ReadonlyArray<Scalars['String']>
}

export type ResolverTypeWrapper<T> = Promise<T> | T

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
) => Maybe<TTypes>

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
	Query: ResolverTypeWrapper<{}>
	Stage: ResolverTypeWrapper<Stage>
	String: ResolverTypeWrapper<Scalars['String']>
	DiffFilter: DiffFilter
	DiffResponse: ResolverTypeWrapper<DiffResponse>
	Boolean: ResolverTypeWrapper<Scalars['Boolean']>
	DiffErrorCode: DiffErrorCode
	DiffResult: ResolverTypeWrapper<DiffResult>
	Event: ResolverTypeWrapper<Event>
	EventType: EventType
	Mutation: ResolverTypeWrapper<{}>
	ReleaseResponse: ResolverTypeWrapper<ReleaseResponse>
	ReleaseErrorCode: ReleaseErrorCode
	RebaseAllResponse: ResolverTypeWrapper<RebaseAllResponse>
	UpdateEvent: ResolverTypeWrapper<UpdateEvent>
	DeleteEvent: ResolverTypeWrapper<DeleteEvent>
	CreateEvent: ResolverTypeWrapper<CreateEvent>
	RunMigrationEvent: ResolverTypeWrapper<RunMigrationEvent>
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
	Query: {}
	Stage: Stage
	String: Scalars['String']
	DiffFilter: DiffFilter
	DiffResponse: DiffResponse
	Boolean: Scalars['Boolean']
	DiffErrorCode: DiffErrorCode
	DiffResult: DiffResult
	Event: Event
	EventType: EventType
	Mutation: {}
	ReleaseResponse: ReleaseResponse
	ReleaseErrorCode: ReleaseErrorCode
	RebaseAllResponse: RebaseAllResponse
	UpdateEvent: UpdateEvent
	DeleteEvent: DeleteEvent
	CreateEvent: CreateEvent
	RunMigrationEvent: RunMigrationEvent
}

export type CreateEventResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateEvent'] = ResolversParentTypes['CreateEvent']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	dependencies?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	type?: Resolver<Maybe<ResolversTypes['EventType']>, ParentType, ContextType>
	description?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	allowed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	entity?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	rowId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type DeleteEventResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DeleteEvent'] = ResolversParentTypes['DeleteEvent']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	dependencies?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	type?: Resolver<Maybe<ResolversTypes['EventType']>, ParentType, ContextType>
	description?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	allowed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	entity?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	rowId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type DiffResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DiffResponse'] = ResolversParentTypes['DiffResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['DiffErrorCode']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['DiffResult']>, ParentType, ContextType>
}

export type DiffResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DiffResult'] = ResolversParentTypes['DiffResult']
> = {
	base?: Resolver<ResolversTypes['Stage'], ParentType, ContextType>
	head?: Resolver<ResolversTypes['Stage'], ParentType, ContextType>
	events?: Resolver<ReadonlyArray<ResolversTypes['Event']>, ParentType, ContextType>
}

export type EventResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Event'] = ResolversParentTypes['Event']
> = {
	__resolveType: TypeResolveFn<
		'UpdateEvent' | 'DeleteEvent' | 'CreateEvent' | 'RunMigrationEvent',
		ParentType,
		ContextType
	>
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	dependencies?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	description?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	allowed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	type?: Resolver<Maybe<ResolversTypes['EventType']>, ParentType, ContextType>
}

export type MutationResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']
> = {
	release?: Resolver<
		ResolversTypes['ReleaseResponse'],
		ParentType,
		ContextType,
		RequireFields<MutationReleaseArgs, 'baseStage' | 'headStage' | 'events'>
	>
	rebaseAll?: Resolver<ResolversTypes['RebaseAllResponse'], ParentType, ContextType>
}

export type QueryResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']
> = {
	stages?: Resolver<ReadonlyArray<ResolversTypes['Stage']>, ParentType, ContextType>
	diff?: Resolver<
		ResolversTypes['DiffResponse'],
		ParentType,
		ContextType,
		RequireFields<QueryDiffArgs, 'baseStage' | 'headStage'>
	>
}

export type RebaseAllResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RebaseAllResponse'] = ResolversParentTypes['RebaseAllResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type ReleaseResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ReleaseResponse'] = ResolversParentTypes['ReleaseResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['ReleaseErrorCode']>, ParentType, ContextType>
}

export type RunMigrationEventResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RunMigrationEvent'] = ResolversParentTypes['RunMigrationEvent']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	dependencies?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	type?: Resolver<Maybe<ResolversTypes['EventType']>, ParentType, ContextType>
	description?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	allowed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	version?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type StageResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Stage'] = ResolversParentTypes['Stage']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type UpdateEventResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['UpdateEvent'] = ResolversParentTypes['UpdateEvent']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	dependencies?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	type?: Resolver<Maybe<ResolversTypes['EventType']>, ParentType, ContextType>
	description?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	allowed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	entity?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	rowId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	fields?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
}

export type Resolvers<ContextType = any> = {
	CreateEvent?: CreateEventResolvers<ContextType>
	DeleteEvent?: DeleteEventResolvers<ContextType>
	DiffResponse?: DiffResponseResolvers<ContextType>
	DiffResult?: DiffResultResolvers<ContextType>
	Event?: EventResolvers
	Mutation?: MutationResolvers<ContextType>
	Query?: QueryResolvers<ContextType>
	RebaseAllResponse?: RebaseAllResponseResolvers<ContextType>
	ReleaseResponse?: ReleaseResponseResolvers<ContextType>
	RunMigrationEvent?: RunMigrationEventResolvers<ContextType>
	Stage?: StageResolvers<ContextType>
	UpdateEvent?: UpdateEventResolvers<ContextType>
}

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = any> = Resolvers<ContextType>
