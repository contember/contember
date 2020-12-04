import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql'
export type Maybe<T> = T | null
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } &
	{ [P in K]-?: NonNullable<T[P]> }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: string
	String: string
	Boolean: boolean
	Int: number
	Float: number
	DateTime: Date
	Json: unknown
}

export type Mutation = {
	readonly __typename?: 'Mutation'
	readonly migrate: MigrateResponse
	readonly rebaseAll: RebaseAllResponse
	readonly release: ReleaseResponse
	readonly releaseTree: ReleaseTreeResponse
	readonly truncate: TruncateResponse
}

export type MutationMigrateArgs = {
	migrations: ReadonlyArray<Migration>
}

export type MutationReleaseArgs = {
	stage: Scalars['String']
	events: ReadonlyArray<Scalars['String']>
}

export type MutationReleaseTreeArgs = {
	stage: Scalars['String']
	tree: ReadonlyArray<TreeFilter>
}

export type TruncateResponse = {
	readonly __typename?: 'TruncateResponse'
	readonly ok: Scalars['Boolean']
}

export type Query = {
	readonly __typename?: 'Query'
	readonly stages: ReadonlyArray<Stage>
	readonly executedMigrations: ReadonlyArray<ExecutedMigration>
	readonly diff: DiffResponse
	readonly history: HistoryResponse
}

export type QueryExecutedMigrationsArgs = {
	version?: Maybe<Scalars['String']>
}

export type QueryDiffArgs = {
	stage: Scalars['String']
	filter?: Maybe<ReadonlyArray<TreeFilter>>
}

export type QueryHistoryArgs = {
	stage: Scalars['String']
	filter?: Maybe<ReadonlyArray<HistoryFilter>>
	sinceEvent?: Maybe<Scalars['String']>
	sinceTime?: Maybe<Scalars['DateTime']>
}

export type HistoryFilter = {
	readonly entity: Scalars['String']
	readonly id: Scalars['String']
}

export type TreeFilter = {
	readonly entity: Scalars['String']
	readonly relations?: Maybe<ReadonlyArray<TreeFilterRelation>>
	readonly id: Scalars['String']
}

export type TreeFilterRelation = {
	readonly name: Scalars['String']
	readonly relations: ReadonlyArray<TreeFilterRelation>
}

export enum HistoryErrorCode {
	StageNotFound = 'STAGE_NOT_FOUND',
}

export type HistoryError = {
	readonly __typename?: 'HistoryError'
	readonly code: HistoryErrorCode
	readonly developerMessage?: Maybe<Scalars['String']>
}

export type HistoryResponse = {
	readonly __typename?: 'HistoryResponse'
	readonly ok?: Maybe<Scalars['Boolean']>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<HistoryErrorCode>
	readonly error?: Maybe<HistoryError>
	readonly result?: Maybe<HistoryResult>
}

export type HistoryResult = {
	readonly __typename?: 'HistoryResult'
	readonly events: ReadonlyArray<HistoryEvent>
}

export type HistoryEvent = {
	readonly id: Scalars['String']
	readonly transactionId: Scalars['String']
	readonly identityDescription: Scalars['String']
	readonly identityId: Scalars['String']
	readonly description: Scalars['String']
	readonly createdAt: Scalars['DateTime']
	readonly type: HistoryEventType
}

export enum HistoryEventType {
	Update = 'UPDATE',
	Delete = 'DELETE',
	Create = 'CREATE',
	RunMigration = 'RUN_MIGRATION',
}

export type HistoryUpdateEvent = HistoryEvent & {
	readonly __typename?: 'HistoryUpdateEvent'
	readonly id: Scalars['String']
	readonly transactionId: Scalars['String']
	readonly identityId: Scalars['String']
	readonly identityDescription: Scalars['String']
	readonly description: Scalars['String']
	readonly createdAt: Scalars['DateTime']
	readonly type: HistoryEventType
	readonly tableName: Scalars['String']
	readonly primaryKeys: ReadonlyArray<Scalars['String']>
	readonly oldValues: Scalars['Json']
	readonly diffValues: Scalars['Json']
}

export type HistoryDeleteEvent = HistoryEvent & {
	readonly __typename?: 'HistoryDeleteEvent'
	readonly id: Scalars['String']
	readonly transactionId: Scalars['String']
	readonly identityId: Scalars['String']
	readonly identityDescription: Scalars['String']
	readonly description: Scalars['String']
	readonly createdAt: Scalars['DateTime']
	readonly type: HistoryEventType
	readonly tableName: Scalars['String']
	readonly primaryKeys: ReadonlyArray<Scalars['String']>
	readonly oldValues: Scalars['Json']
}

export type HistoryCreateEvent = HistoryEvent & {
	readonly __typename?: 'HistoryCreateEvent'
	readonly id: Scalars['String']
	readonly transactionId: Scalars['String']
	readonly identityId: Scalars['String']
	readonly identityDescription: Scalars['String']
	readonly description: Scalars['String']
	readonly createdAt: Scalars['DateTime']
	readonly type: HistoryEventType
	readonly tableName: Scalars['String']
	readonly primaryKeys: ReadonlyArray<Scalars['String']>
	readonly newValues: Scalars['Json']
}

export type HistoryRunMigrationEvent = HistoryEvent & {
	readonly __typename?: 'HistoryRunMigrationEvent'
	readonly id: Scalars['String']
	readonly transactionId: Scalars['String']
	readonly identityId: Scalars['String']
	readonly identityDescription: Scalars['String']
	readonly description: Scalars['String']
	readonly createdAt: Scalars['DateTime']
	readonly type: HistoryEventType
}

export enum DiffErrorCode {
	StageNotFound = 'STAGE_NOT_FOUND',
	MissingBase = 'MISSING_BASE',
	NotRebased = 'NOT_REBASED',
	InvalidFilter = 'INVALID_FILTER',
}

export type DiffError = {
	readonly __typename?: 'DiffError'
	readonly code: DiffErrorCode
	readonly developerMessage?: Maybe<Scalars['String']>
}

export type DiffResponse = {
	readonly __typename?: 'DiffResponse'
	readonly ok: Scalars['Boolean']
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<DiffErrorCode>
	readonly error?: Maybe<DiffError>
	readonly result?: Maybe<DiffResult>
}

export type DiffResult = {
	readonly __typename?: 'DiffResult'
	readonly base: Stage
	readonly head: Stage
	readonly events: ReadonlyArray<DiffEvent>
}

export type ExecutedMigration = {
	readonly __typename?: 'ExecutedMigration'
	readonly version: Scalars['String']
	readonly name: Scalars['String']
	readonly executedAt: Scalars['DateTime']
	readonly checksum: Scalars['String']
	readonly formatVersion: Scalars['Int']
	readonly modifications: ReadonlyArray<Scalars['Json']>
}

export type Migration = {
	readonly version: Scalars['String']
	readonly name: Scalars['String']
	readonly formatVersion: Scalars['Int']
	readonly modifications: ReadonlyArray<Scalars['Json']>
}

export enum MigrateErrorCode {
	MustFollowLatest = 'MUST_FOLLOW_LATEST',
	AlreadyExecuted = 'ALREADY_EXECUTED',
	InvalidFormat = 'INVALID_FORMAT',
	InvalidSchema = 'INVALID_SCHEMA',
	MigrationFailed = 'MIGRATION_FAILED',
}

export type MigrateError = {
	readonly __typename?: 'MigrateError'
	readonly code: MigrateErrorCode
	readonly migration: Scalars['String']
	readonly developerMessage: Scalars['String']
}

export type MigrateResponse = {
	readonly __typename?: 'MigrateResponse'
	readonly ok: Scalars['Boolean']
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<MigrateError>
	readonly error?: Maybe<MigrateError>
	readonly result?: Maybe<MigrateResult>
}

export type MigrateResult = {
	readonly __typename?: 'MigrateResult'
	readonly developerMessage: Scalars['String']
}

export enum ReleaseErrorCode {
	StageNotFound = 'STAGE_NOT_FOUND',
	MissingBase = 'MISSING_BASE',
	MissingDependency = 'MISSING_DEPENDENCY',
	Forbidden = 'FORBIDDEN',
}

export type ReleaseError = {
	readonly __typename?: 'ReleaseError'
	readonly code: ReleaseErrorCode
	readonly developerMessage?: Maybe<Scalars['String']>
}

export type ReleaseResponse = {
	readonly __typename?: 'ReleaseResponse'
	readonly ok: Scalars['Boolean']
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<ReleaseErrorCode>
	readonly error?: Maybe<ReleaseError>
}

export enum ReleaseTreeErrorCode {
	StageNotFound = 'STAGE_NOT_FOUND',
	MissingBase = 'MISSING_BASE',
	Forbidden = 'FORBIDDEN',
	NotRebased = 'NOT_REBASED',
	InvalidFilter = 'INVALID_FILTER',
}

export type ReleaseTreeError = {
	readonly __typename?: 'ReleaseTreeError'
	readonly code: ReleaseTreeErrorCode
	readonly developerMessage?: Maybe<Scalars['String']>
}

export type ReleaseTreeResponse = {
	readonly __typename?: 'ReleaseTreeResponse'
	readonly ok: Scalars['Boolean']
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<ReleaseTreeErrorCode>
	readonly error?: Maybe<ReleaseTreeError>
}

export type RebaseAllResponse = {
	readonly __typename?: 'RebaseAllResponse'
	readonly ok: Scalars['Boolean']
}

export type DiffEvent = {
	readonly id: Scalars['String']
	readonly transactionId: Scalars['String']
	readonly identityDescription: Scalars['String']
	readonly identityId: Scalars['String']
	readonly dependencies: ReadonlyArray<Scalars['String']>
	readonly description: Scalars['String']
	readonly createdAt: Scalars['DateTime']
	readonly type: DiffEventType
}

export enum DiffEventType {
	Update = 'UPDATE',
	Delete = 'DELETE',
	Create = 'CREATE',
}

export type DiffUpdateEvent = DiffEvent & {
	readonly __typename?: 'DiffUpdateEvent'
	readonly id: Scalars['String']
	readonly transactionId: Scalars['String']
	readonly identityId: Scalars['String']
	readonly identityDescription: Scalars['String']
	readonly dependencies: ReadonlyArray<Scalars['String']>
	readonly type: DiffEventType
	readonly description: Scalars['String']
	readonly createdAt: Scalars['DateTime']
}

export type DiffDeleteEvent = DiffEvent & {
	readonly __typename?: 'DiffDeleteEvent'
	readonly id: Scalars['String']
	readonly transactionId: Scalars['String']
	readonly identityId: Scalars['String']
	readonly identityDescription: Scalars['String']
	readonly dependencies: ReadonlyArray<Scalars['String']>
	readonly type: DiffEventType
	readonly description: Scalars['String']
	readonly createdAt: Scalars['DateTime']
}

export type DiffCreateEvent = DiffEvent & {
	readonly __typename?: 'DiffCreateEvent'
	readonly id: Scalars['String']
	readonly transactionId: Scalars['String']
	readonly identityId: Scalars['String']
	readonly identityDescription: Scalars['String']
	readonly dependencies: ReadonlyArray<Scalars['String']>
	readonly type: DiffEventType
	readonly description: Scalars['String']
	readonly createdAt: Scalars['DateTime']
}

export type Stage = {
	readonly __typename?: 'Stage'
	readonly id: Scalars['String']
	readonly name: Scalars['String']
	readonly slug: Scalars['String']
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
	Mutation: ResolverTypeWrapper<{}>
	String: ResolverTypeWrapper<Scalars['String']>
	TruncateResponse: ResolverTypeWrapper<TruncateResponse>
	Boolean: ResolverTypeWrapper<Scalars['Boolean']>
	DateTime: ResolverTypeWrapper<Scalars['DateTime']>
	Json: ResolverTypeWrapper<Scalars['Json']>
	Query: ResolverTypeWrapper<{}>
	HistoryFilter: HistoryFilter
	TreeFilter: TreeFilter
	TreeFilterRelation: TreeFilterRelation
	HistoryErrorCode: HistoryErrorCode
	HistoryError: ResolverTypeWrapper<HistoryError>
	HistoryResponse: ResolverTypeWrapper<HistoryResponse>
	HistoryResult: ResolverTypeWrapper<HistoryResult>
	HistoryEvent:
		| ResolversTypes['HistoryUpdateEvent']
		| ResolversTypes['HistoryDeleteEvent']
		| ResolversTypes['HistoryCreateEvent']
		| ResolversTypes['HistoryRunMigrationEvent']
	HistoryEventType: HistoryEventType
	HistoryUpdateEvent: ResolverTypeWrapper<HistoryUpdateEvent>
	HistoryDeleteEvent: ResolverTypeWrapper<HistoryDeleteEvent>
	HistoryCreateEvent: ResolverTypeWrapper<HistoryCreateEvent>
	HistoryRunMigrationEvent: ResolverTypeWrapper<HistoryRunMigrationEvent>
	DiffErrorCode: DiffErrorCode
	DiffError: ResolverTypeWrapper<DiffError>
	DiffResponse: ResolverTypeWrapper<DiffResponse>
	DiffResult: ResolverTypeWrapper<DiffResult>
	ExecutedMigration: ResolverTypeWrapper<ExecutedMigration>
	Int: ResolverTypeWrapper<Scalars['Int']>
	Migration: Migration
	MigrateErrorCode: MigrateErrorCode
	MigrateError: ResolverTypeWrapper<MigrateError>
	MigrateResponse: ResolverTypeWrapper<MigrateResponse>
	MigrateResult: ResolverTypeWrapper<MigrateResult>
	ReleaseErrorCode: ReleaseErrorCode
	ReleaseError: ResolverTypeWrapper<ReleaseError>
	ReleaseResponse: ResolverTypeWrapper<ReleaseResponse>
	ReleaseTreeErrorCode: ReleaseTreeErrorCode
	ReleaseTreeError: ResolverTypeWrapper<ReleaseTreeError>
	ReleaseTreeResponse: ResolverTypeWrapper<ReleaseTreeResponse>
	RebaseAllResponse: ResolverTypeWrapper<RebaseAllResponse>
	DiffEvent: ResolversTypes['DiffUpdateEvent'] | ResolversTypes['DiffDeleteEvent'] | ResolversTypes['DiffCreateEvent']
	DiffEventType: DiffEventType
	DiffUpdateEvent: ResolverTypeWrapper<DiffUpdateEvent>
	DiffDeleteEvent: ResolverTypeWrapper<DiffDeleteEvent>
	DiffCreateEvent: ResolverTypeWrapper<DiffCreateEvent>
	Stage: ResolverTypeWrapper<Stage>
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
	Mutation: {}
	String: Scalars['String']
	TruncateResponse: TruncateResponse
	Boolean: Scalars['Boolean']
	DateTime: Scalars['DateTime']
	Json: Scalars['Json']
	Query: {}
	HistoryFilter: HistoryFilter
	TreeFilter: TreeFilter
	TreeFilterRelation: TreeFilterRelation
	HistoryError: HistoryError
	HistoryResponse: HistoryResponse
	HistoryResult: HistoryResult
	HistoryEvent:
		| ResolversParentTypes['HistoryUpdateEvent']
		| ResolversParentTypes['HistoryDeleteEvent']
		| ResolversParentTypes['HistoryCreateEvent']
		| ResolversParentTypes['HistoryRunMigrationEvent']
	HistoryUpdateEvent: HistoryUpdateEvent
	HistoryDeleteEvent: HistoryDeleteEvent
	HistoryCreateEvent: HistoryCreateEvent
	HistoryRunMigrationEvent: HistoryRunMigrationEvent
	DiffError: DiffError
	DiffResponse: DiffResponse
	DiffResult: DiffResult
	ExecutedMigration: ExecutedMigration
	Int: Scalars['Int']
	Migration: Migration
	MigrateError: MigrateError
	MigrateResponse: MigrateResponse
	MigrateResult: MigrateResult
	ReleaseError: ReleaseError
	ReleaseResponse: ReleaseResponse
	ReleaseTreeError: ReleaseTreeError
	ReleaseTreeResponse: ReleaseTreeResponse
	RebaseAllResponse: RebaseAllResponse
	DiffEvent:
		| ResolversParentTypes['DiffUpdateEvent']
		| ResolversParentTypes['DiffDeleteEvent']
		| ResolversParentTypes['DiffCreateEvent']
	DiffUpdateEvent: DiffUpdateEvent
	DiffDeleteEvent: DiffDeleteEvent
	DiffCreateEvent: DiffCreateEvent
	Stage: Stage
}

export type MutationResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']
> = {
	migrate?: Resolver<
		ResolversTypes['MigrateResponse'],
		ParentType,
		ContextType,
		RequireFields<MutationMigrateArgs, 'migrations'>
	>
	rebaseAll?: Resolver<ResolversTypes['RebaseAllResponse'], ParentType, ContextType>
	release?: Resolver<
		ResolversTypes['ReleaseResponse'],
		ParentType,
		ContextType,
		RequireFields<MutationReleaseArgs, 'stage' | 'events'>
	>
	releaseTree?: Resolver<
		ResolversTypes['ReleaseTreeResponse'],
		ParentType,
		ContextType,
		RequireFields<MutationReleaseTreeArgs, 'stage' | 'tree'>
	>
	truncate?: Resolver<ResolversTypes['TruncateResponse'], ParentType, ContextType>
}

export type TruncateResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['TruncateResponse'] = ResolversParentTypes['TruncateResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
	name: 'DateTime'
}

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Json'], any> {
	name: 'Json'
}

export type QueryResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']
> = {
	stages?: Resolver<ReadonlyArray<ResolversTypes['Stage']>, ParentType, ContextType>
	executedMigrations?: Resolver<
		ReadonlyArray<ResolversTypes['ExecutedMigration']>,
		ParentType,
		ContextType,
		RequireFields<QueryExecutedMigrationsArgs, never>
	>
	diff?: Resolver<ResolversTypes['DiffResponse'], ParentType, ContextType, RequireFields<QueryDiffArgs, 'stage'>>
	history?: Resolver<
		ResolversTypes['HistoryResponse'],
		ParentType,
		ContextType,
		RequireFields<QueryHistoryArgs, 'stage'>
	>
}

export type HistoryErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['HistoryError'] = ResolversParentTypes['HistoryError']
> = {
	code?: Resolver<ResolversTypes['HistoryErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type HistoryResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['HistoryResponse'] = ResolversParentTypes['HistoryResponse']
> = {
	ok?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['HistoryErrorCode']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['HistoryError']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['HistoryResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type HistoryResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['HistoryResult'] = ResolversParentTypes['HistoryResult']
> = {
	events?: Resolver<ReadonlyArray<ResolversTypes['HistoryEvent']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type HistoryEventResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['HistoryEvent'] = ResolversParentTypes['HistoryEvent']
> = {
	__resolveType: TypeResolveFn<
		'HistoryUpdateEvent' | 'HistoryDeleteEvent' | 'HistoryCreateEvent' | 'HistoryRunMigrationEvent',
		ParentType,
		ContextType
	>
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	transactionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityDescription?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	description?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	type?: Resolver<ResolversTypes['HistoryEventType'], ParentType, ContextType>
}

export type HistoryUpdateEventResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['HistoryUpdateEvent'] = ResolversParentTypes['HistoryUpdateEvent']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	transactionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityDescription?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	description?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	type?: Resolver<ResolversTypes['HistoryEventType'], ParentType, ContextType>
	tableName?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	primaryKeys?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	oldValues?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	diffValues?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type HistoryDeleteEventResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['HistoryDeleteEvent'] = ResolversParentTypes['HistoryDeleteEvent']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	transactionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityDescription?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	description?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	type?: Resolver<ResolversTypes['HistoryEventType'], ParentType, ContextType>
	tableName?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	primaryKeys?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	oldValues?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type HistoryCreateEventResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['HistoryCreateEvent'] = ResolversParentTypes['HistoryCreateEvent']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	transactionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityDescription?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	description?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	type?: Resolver<ResolversTypes['HistoryEventType'], ParentType, ContextType>
	tableName?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	primaryKeys?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	newValues?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type HistoryRunMigrationEventResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['HistoryRunMigrationEvent'] = ResolversParentTypes['HistoryRunMigrationEvent']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	transactionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityDescription?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	description?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	type?: Resolver<ResolversTypes['HistoryEventType'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type DiffErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DiffError'] = ResolversParentTypes['DiffError']
> = {
	code?: Resolver<ResolversTypes['DiffErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type DiffResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DiffResponse'] = ResolversParentTypes['DiffResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['DiffErrorCode']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['DiffError']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['DiffResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type DiffResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DiffResult'] = ResolversParentTypes['DiffResult']
> = {
	base?: Resolver<ResolversTypes['Stage'], ParentType, ContextType>
	head?: Resolver<ResolversTypes['Stage'], ParentType, ContextType>
	events?: Resolver<ReadonlyArray<ResolversTypes['DiffEvent']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ExecutedMigrationResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ExecutedMigration'] = ResolversParentTypes['ExecutedMigration']
> = {
	version?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	executedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	checksum?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	formatVersion?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
	modifications?: Resolver<ReadonlyArray<ResolversTypes['Json']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type MigrateErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['MigrateError'] = ResolversParentTypes['MigrateError']
> = {
	code?: Resolver<ResolversTypes['MigrateErrorCode'], ParentType, ContextType>
	migration?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type MigrateResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['MigrateResponse'] = ResolversParentTypes['MigrateResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['MigrateError']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['MigrateError']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['MigrateResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type MigrateResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['MigrateResult'] = ResolversParentTypes['MigrateResult']
> = {
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ReleaseErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ReleaseError'] = ResolversParentTypes['ReleaseError']
> = {
	code?: Resolver<ResolversTypes['ReleaseErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ReleaseResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ReleaseResponse'] = ResolversParentTypes['ReleaseResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['ReleaseErrorCode']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['ReleaseError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ReleaseTreeErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ReleaseTreeError'] = ResolversParentTypes['ReleaseTreeError']
> = {
	code?: Resolver<ResolversTypes['ReleaseTreeErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ReleaseTreeResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ReleaseTreeResponse'] = ResolversParentTypes['ReleaseTreeResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['ReleaseTreeErrorCode']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['ReleaseTreeError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RebaseAllResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RebaseAllResponse'] = ResolversParentTypes['RebaseAllResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type DiffEventResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DiffEvent'] = ResolversParentTypes['DiffEvent']
> = {
	__resolveType: TypeResolveFn<'DiffUpdateEvent' | 'DiffDeleteEvent' | 'DiffCreateEvent', ParentType, ContextType>
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	transactionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityDescription?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	dependencies?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	description?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	type?: Resolver<ResolversTypes['DiffEventType'], ParentType, ContextType>
}

export type DiffUpdateEventResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DiffUpdateEvent'] = ResolversParentTypes['DiffUpdateEvent']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	transactionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityDescription?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	dependencies?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	type?: Resolver<ResolversTypes['DiffEventType'], ParentType, ContextType>
	description?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type DiffDeleteEventResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DiffDeleteEvent'] = ResolversParentTypes['DiffDeleteEvent']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	transactionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityDescription?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	dependencies?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	type?: Resolver<ResolversTypes['DiffEventType'], ParentType, ContextType>
	description?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type DiffCreateEventResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DiffCreateEvent'] = ResolversParentTypes['DiffCreateEvent']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	transactionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityDescription?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	dependencies?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	type?: Resolver<ResolversTypes['DiffEventType'], ParentType, ContextType>
	description?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type StageResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Stage'] = ResolversParentTypes['Stage']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type Resolvers<ContextType = any> = {
	Mutation?: MutationResolvers<ContextType>
	TruncateResponse?: TruncateResponseResolvers<ContextType>
	DateTime?: GraphQLScalarType
	Json?: GraphQLScalarType
	Query?: QueryResolvers<ContextType>
	HistoryError?: HistoryErrorResolvers<ContextType>
	HistoryResponse?: HistoryResponseResolvers<ContextType>
	HistoryResult?: HistoryResultResolvers<ContextType>
	HistoryEvent?: HistoryEventResolvers<ContextType>
	HistoryUpdateEvent?: HistoryUpdateEventResolvers<ContextType>
	HistoryDeleteEvent?: HistoryDeleteEventResolvers<ContextType>
	HistoryCreateEvent?: HistoryCreateEventResolvers<ContextType>
	HistoryRunMigrationEvent?: HistoryRunMigrationEventResolvers<ContextType>
	DiffError?: DiffErrorResolvers<ContextType>
	DiffResponse?: DiffResponseResolvers<ContextType>
	DiffResult?: DiffResultResolvers<ContextType>
	ExecutedMigration?: ExecutedMigrationResolvers<ContextType>
	MigrateError?: MigrateErrorResolvers<ContextType>
	MigrateResponse?: MigrateResponseResolvers<ContextType>
	MigrateResult?: MigrateResultResolvers<ContextType>
	ReleaseError?: ReleaseErrorResolvers<ContextType>
	ReleaseResponse?: ReleaseResponseResolvers<ContextType>
	ReleaseTreeError?: ReleaseTreeErrorResolvers<ContextType>
	ReleaseTreeResponse?: ReleaseTreeResponseResolvers<ContextType>
	RebaseAllResponse?: RebaseAllResponseResolvers<ContextType>
	DiffEvent?: DiffEventResolvers<ContextType>
	DiffUpdateEvent?: DiffUpdateEventResolvers<ContextType>
	DiffDeleteEvent?: DiffDeleteEventResolvers<ContextType>
	DiffCreateEvent?: DiffCreateEventResolvers<ContextType>
	Stage?: StageResolvers<ContextType>
}

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = any> = Resolvers<ContextType>
