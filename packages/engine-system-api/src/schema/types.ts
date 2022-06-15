import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: string
	String: string
	Boolean: boolean
	Int: number
	Float: number
	DateTime: Date
	Json: unknown
	PrimaryKey: any
}

export type CreateEvent = Event & {
	readonly __typename?: 'CreateEvent'
	readonly appliedAt: Scalars['DateTime']
	readonly createdAt: Scalars['DateTime']
	readonly description: Scalars['String']
	readonly id: Scalars['String']
	readonly identityDescription: Scalars['String']
	readonly identityId: Scalars['String']
	readonly newValues: Scalars['Json']
	readonly primaryKey: ReadonlyArray<Scalars['PrimaryKey']>
	readonly tableName: Scalars['String']
	readonly transactionId: Scalars['String']
	readonly type: EventType
}

export type DeleteEvent = Event & {
	readonly __typename?: 'DeleteEvent'
	readonly appliedAt: Scalars['DateTime']
	readonly createdAt: Scalars['DateTime']
	readonly description: Scalars['String']
	readonly id: Scalars['String']
	readonly identityDescription: Scalars['String']
	readonly identityId: Scalars['String']
	readonly oldValues: Scalars['Json']
	readonly primaryKey: ReadonlyArray<Scalars['PrimaryKey']>
	readonly tableName: Scalars['String']
	readonly transactionId: Scalars['String']
	readonly type: EventType
}

export type Event = {
	readonly appliedAt: Scalars['DateTime']
	readonly createdAt: Scalars['DateTime']
	readonly description: Scalars['String']
	readonly id: Scalars['String']
	readonly identityDescription: Scalars['String']
	readonly identityId: Scalars['String']
	readonly primaryKey: ReadonlyArray<Scalars['PrimaryKey']>
	readonly tableName: Scalars['String']
	readonly transactionId: Scalars['String']
	readonly type: EventType
}

export type EventFilterRow = {
	readonly primaryKey: ReadonlyArray<Scalars['PrimaryKey']>
	readonly tableName: Scalars['String']
}

export enum EventType {
	Create = 'CREATE',
	Delete = 'DELETE',
	Update = 'UPDATE'
}

export type EventsArgs = {
	readonly filter?: InputMaybe<EventsFilter>
	/** Max 10000 */
	readonly limit?: InputMaybe<Scalars['Int']>
	readonly offset?: InputMaybe<Scalars['Int']>
	readonly order?: InputMaybe<EventsOrder>
	readonly stage?: InputMaybe<Scalars['String']>
}

export type EventsFilter = {
	readonly appliedAt?: InputMaybe<EventsFilterDate>
	readonly createdAt?: InputMaybe<EventsFilterDate>
	readonly identities?: InputMaybe<ReadonlyArray<Scalars['String']>>
	readonly rows?: InputMaybe<ReadonlyArray<EventFilterRow>>
	readonly tables?: InputMaybe<ReadonlyArray<Scalars['String']>>
	readonly transactions?: InputMaybe<ReadonlyArray<Scalars['String']>>
	readonly types?: InputMaybe<ReadonlyArray<EventType>>
}

export type EventsFilterDate = {
	readonly from?: InputMaybe<Scalars['DateTime']>
	readonly to?: InputMaybe<Scalars['DateTime']>
}

export enum EventsOrder {
	AppliedAtAsc = 'APPLIED_AT_ASC',
	AppliedAtDesc = 'APPLIED_AT_DESC',
	CreatedAtAsc = 'CREATED_AT_ASC',
	CreatedAtDesc = 'CREATED_AT_DESC'
}

export type ExecutedMigration = {
	readonly __typename?: 'ExecutedMigration'
	readonly checksum: Scalars['String']
	readonly executedAt: Scalars['DateTime']
	readonly formatVersion: Scalars['Int']
	readonly modifications: ReadonlyArray<Scalars['Json']>
	readonly name: Scalars['String']
	readonly version: Scalars['String']
}

export type MigrateError = {
	readonly __typename?: 'MigrateError'
	readonly code: MigrateErrorCode
	readonly developerMessage: Scalars['String']
	readonly migration: Scalars['String']
}

export enum MigrateErrorCode {
	AlreadyExecuted = 'ALREADY_EXECUTED',
	InvalidFormat = 'INVALID_FORMAT',
	InvalidSchema = 'INVALID_SCHEMA',
	MigrationFailed = 'MIGRATION_FAILED',
	MustFollowLatest = 'MUST_FOLLOW_LATEST'
}

export type MigrateResponse = {
	readonly __typename?: 'MigrateResponse'
	readonly error?: Maybe<MigrateError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<MigrateError>
	readonly ok: Scalars['Boolean']
	readonly result?: Maybe<MigrateResult>
}

export type MigrateResult = {
	readonly __typename?: 'MigrateResult'
	readonly message: Scalars['String']
}

export type Migration = {
	readonly formatVersion: Scalars['Int']
	readonly modifications: ReadonlyArray<Scalars['Json']>
	readonly name: Scalars['String']
	readonly version: Scalars['String']
}

export type MigrationDeleteError = {
	readonly __typename?: 'MigrationDeleteError'
	readonly code: MigrationDeleteErrorCode
	readonly developerMessage: Scalars['String']
}

export enum MigrationDeleteErrorCode {
	InvalidFormat = 'INVALID_FORMAT',
	NotFound = 'NOT_FOUND'
}

export type MigrationDeleteResponse = {
	readonly __typename?: 'MigrationDeleteResponse'
	readonly error?: Maybe<MigrationDeleteError>
	readonly ok: Scalars['Boolean']
}

export type MigrationModification = {
	readonly formatVersion?: InputMaybe<Scalars['Int']>
	readonly modifications?: InputMaybe<ReadonlyArray<Scalars['Json']>>
	readonly name?: InputMaybe<Scalars['String']>
	readonly version?: InputMaybe<Scalars['String']>
}

export type MigrationModifyError = {
	readonly __typename?: 'MigrationModifyError'
	readonly code: MigrationModifyErrorCode
	readonly developerMessage: Scalars['String']
}

export enum MigrationModifyErrorCode {
	NotFound = 'NOT_FOUND'
}

export type MigrationModifyResponse = {
	readonly __typename?: 'MigrationModifyResponse'
	readonly error?: Maybe<MigrationModifyError>
	readonly ok: Scalars['Boolean']
}

export type Mutation = {
	readonly __typename?: 'Mutation'
	readonly forceMigrate: MigrateResponse
	readonly migrate: MigrateResponse
	readonly migrationDelete: MigrationDeleteResponse
	readonly migrationModify: MigrationModifyResponse
	readonly truncate: TruncateResponse
}


export type MutationForceMigrateArgs = {
	migrations: ReadonlyArray<Migration>
}


export type MutationMigrateArgs = {
	migrations: ReadonlyArray<Migration>
}


export type MutationMigrationDeleteArgs = {
	migration: Scalars['String']
}


export type MutationMigrationModifyArgs = {
	migration: Scalars['String']
	modification: MigrationModification
}

export type Query = {
	readonly __typename?: 'Query'
	readonly events: ReadonlyArray<Event>
	readonly executedMigrations: ReadonlyArray<ExecutedMigration>
	readonly stages: ReadonlyArray<Stage>
}


export type QueryEventsArgs = {
	args?: InputMaybe<EventsArgs>
}


export type QueryExecutedMigrationsArgs = {
	version?: InputMaybe<Scalars['String']>
}

export type Stage = {
	readonly __typename?: 'Stage'
	readonly id: Scalars['String']
	readonly name: Scalars['String']
	readonly slug: Scalars['String']
}

export type TruncateResponse = {
	readonly __typename?: 'TruncateResponse'
	readonly ok: Scalars['Boolean']
}

export type UpdateEvent = Event & {
	readonly __typename?: 'UpdateEvent'
	readonly appliedAt: Scalars['DateTime']
	readonly createdAt: Scalars['DateTime']
	readonly description: Scalars['String']
	readonly diffValues: Scalars['Json']
	readonly id: Scalars['String']
	readonly identityDescription: Scalars['String']
	readonly identityId: Scalars['String']
	readonly oldValues: Scalars['Json']
	readonly primaryKey: ReadonlyArray<Scalars['PrimaryKey']>
	readonly tableName: Scalars['String']
	readonly transactionId: Scalars['String']
	readonly type: EventType
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
	CreateEvent: ResolverTypeWrapper<CreateEvent>
	DateTime: ResolverTypeWrapper<Scalars['DateTime']>
	DeleteEvent: ResolverTypeWrapper<DeleteEvent>
	Event: ResolversTypes['CreateEvent'] | ResolversTypes['DeleteEvent'] | ResolversTypes['UpdateEvent']
	EventFilterRow: EventFilterRow
	EventType: EventType
	EventsArgs: EventsArgs
	EventsFilter: EventsFilter
	EventsFilterDate: EventsFilterDate
	EventsOrder: EventsOrder
	ExecutedMigration: ResolverTypeWrapper<ExecutedMigration>
	Int: ResolverTypeWrapper<Scalars['Int']>
	Json: ResolverTypeWrapper<Scalars['Json']>
	MigrateError: ResolverTypeWrapper<MigrateError>
	MigrateErrorCode: MigrateErrorCode
	MigrateResponse: ResolverTypeWrapper<MigrateResponse>
	MigrateResult: ResolverTypeWrapper<MigrateResult>
	Migration: Migration
	MigrationDeleteError: ResolverTypeWrapper<MigrationDeleteError>
	MigrationDeleteErrorCode: MigrationDeleteErrorCode
	MigrationDeleteResponse: ResolverTypeWrapper<MigrationDeleteResponse>
	MigrationModification: MigrationModification
	MigrationModifyError: ResolverTypeWrapper<MigrationModifyError>
	MigrationModifyErrorCode: MigrationModifyErrorCode
	MigrationModifyResponse: ResolverTypeWrapper<MigrationModifyResponse>
	Mutation: ResolverTypeWrapper<{}>
	PrimaryKey: ResolverTypeWrapper<Scalars['PrimaryKey']>
	Query: ResolverTypeWrapper<{}>
	Stage: ResolverTypeWrapper<Stage>
	String: ResolverTypeWrapper<Scalars['String']>
	TruncateResponse: ResolverTypeWrapper<TruncateResponse>
	UpdateEvent: ResolverTypeWrapper<UpdateEvent>
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
	Boolean: Scalars['Boolean']
	CreateEvent: CreateEvent
	DateTime: Scalars['DateTime']
	DeleteEvent: DeleteEvent
	Event: ResolversParentTypes['CreateEvent'] | ResolversParentTypes['DeleteEvent'] | ResolversParentTypes['UpdateEvent']
	EventFilterRow: EventFilterRow
	EventsArgs: EventsArgs
	EventsFilter: EventsFilter
	EventsFilterDate: EventsFilterDate
	ExecutedMigration: ExecutedMigration
	Int: Scalars['Int']
	Json: Scalars['Json']
	MigrateError: MigrateError
	MigrateResponse: MigrateResponse
	MigrateResult: MigrateResult
	Migration: Migration
	MigrationDeleteError: MigrationDeleteError
	MigrationDeleteResponse: MigrationDeleteResponse
	MigrationModification: MigrationModification
	MigrationModifyError: MigrationModifyError
	MigrationModifyResponse: MigrationModifyResponse
	Mutation: {}
	PrimaryKey: Scalars['PrimaryKey']
	Query: {}
	Stage: Stage
	String: Scalars['String']
	TruncateResponse: TruncateResponse
	UpdateEvent: UpdateEvent
}

export type CreateEventResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateEvent'] = ResolversParentTypes['CreateEvent']> = {
	appliedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	description?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityDescription?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	newValues?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	primaryKey?: Resolver<ReadonlyArray<ResolversTypes['PrimaryKey']>, ParentType, ContextType>
	tableName?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	transactionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	type?: Resolver<ResolversTypes['EventType'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
	name: 'DateTime'
}

export type DeleteEventResolvers<ContextType = any, ParentType extends ResolversParentTypes['DeleteEvent'] = ResolversParentTypes['DeleteEvent']> = {
	appliedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	description?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityDescription?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	oldValues?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	primaryKey?: Resolver<ReadonlyArray<ResolversTypes['PrimaryKey']>, ParentType, ContextType>
	tableName?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	transactionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	type?: Resolver<ResolversTypes['EventType'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type EventResolvers<ContextType = any, ParentType extends ResolversParentTypes['Event'] = ResolversParentTypes['Event']> = {
	__resolveType: TypeResolveFn<'CreateEvent' | 'DeleteEvent' | 'UpdateEvent', ParentType, ContextType>
	appliedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	description?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityDescription?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	primaryKey?: Resolver<ReadonlyArray<ResolversTypes['PrimaryKey']>, ParentType, ContextType>
	tableName?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	transactionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	type?: Resolver<ResolversTypes['EventType'], ParentType, ContextType>
}

export type ExecutedMigrationResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExecutedMigration'] = ResolversParentTypes['ExecutedMigration']> = {
	checksum?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	executedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	formatVersion?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
	modifications?: Resolver<ReadonlyArray<ResolversTypes['Json']>, ParentType, ContextType>
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	version?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Json'], any> {
	name: 'Json'
}

export type MigrateErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['MigrateError'] = ResolversParentTypes['MigrateError']> = {
	code?: Resolver<ResolversTypes['MigrateErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	migration?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type MigrateResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['MigrateResponse'] = ResolversParentTypes['MigrateResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['MigrateError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['MigrateError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['MigrateResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type MigrateResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['MigrateResult'] = ResolversParentTypes['MigrateResult']> = {
	message?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type MigrationDeleteErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['MigrationDeleteError'] = ResolversParentTypes['MigrationDeleteError']> = {
	code?: Resolver<ResolversTypes['MigrationDeleteErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type MigrationDeleteResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['MigrationDeleteResponse'] = ResolversParentTypes['MigrationDeleteResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['MigrationDeleteError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type MigrationModifyErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['MigrationModifyError'] = ResolversParentTypes['MigrationModifyError']> = {
	code?: Resolver<ResolversTypes['MigrationModifyErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type MigrationModifyResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['MigrationModifyResponse'] = ResolversParentTypes['MigrationModifyResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['MigrationModifyError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
	forceMigrate?: Resolver<ResolversTypes['MigrateResponse'], ParentType, ContextType, RequireFields<MutationForceMigrateArgs, 'migrations'>>
	migrate?: Resolver<ResolversTypes['MigrateResponse'], ParentType, ContextType, RequireFields<MutationMigrateArgs, 'migrations'>>
	migrationDelete?: Resolver<ResolversTypes['MigrationDeleteResponse'], ParentType, ContextType, RequireFields<MutationMigrationDeleteArgs, 'migration'>>
	migrationModify?: Resolver<ResolversTypes['MigrationModifyResponse'], ParentType, ContextType, RequireFields<MutationMigrationModifyArgs, 'migration' | 'modification'>>
	truncate?: Resolver<ResolversTypes['TruncateResponse'], ParentType, ContextType>
}

export interface PrimaryKeyScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['PrimaryKey'], any> {
	name: 'PrimaryKey'
}

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
	events?: Resolver<ReadonlyArray<ResolversTypes['Event']>, ParentType, ContextType, Partial<QueryEventsArgs>>
	executedMigrations?: Resolver<ReadonlyArray<ResolversTypes['ExecutedMigration']>, ParentType, ContextType, Partial<QueryExecutedMigrationsArgs>>
	stages?: Resolver<ReadonlyArray<ResolversTypes['Stage']>, ParentType, ContextType>
}

export type StageResolvers<ContextType = any, ParentType extends ResolversParentTypes['Stage'] = ResolversParentTypes['Stage']> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type TruncateResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['TruncateResponse'] = ResolversParentTypes['TruncateResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type UpdateEventResolvers<ContextType = any, ParentType extends ResolversParentTypes['UpdateEvent'] = ResolversParentTypes['UpdateEvent']> = {
	appliedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	description?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	diffValues?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityDescription?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	oldValues?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	primaryKey?: Resolver<ReadonlyArray<ResolversTypes['PrimaryKey']>, ParentType, ContextType>
	tableName?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	transactionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	type?: Resolver<ResolversTypes['EventType'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type Resolvers<ContextType = any> = {
	CreateEvent?: CreateEventResolvers<ContextType>
	DateTime?: GraphQLScalarType
	DeleteEvent?: DeleteEventResolvers<ContextType>
	Event?: EventResolvers<ContextType>
	ExecutedMigration?: ExecutedMigrationResolvers<ContextType>
	Json?: GraphQLScalarType
	MigrateError?: MigrateErrorResolvers<ContextType>
	MigrateResponse?: MigrateResponseResolvers<ContextType>
	MigrateResult?: MigrateResultResolvers<ContextType>
	MigrationDeleteError?: MigrationDeleteErrorResolvers<ContextType>
	MigrationDeleteResponse?: MigrationDeleteResponseResolvers<ContextType>
	MigrationModifyError?: MigrationModifyErrorResolvers<ContextType>
	MigrationModifyResponse?: MigrationModifyResponseResolvers<ContextType>
	Mutation?: MutationResolvers<ContextType>
	PrimaryKey?: GraphQLScalarType
	Query?: QueryResolvers<ContextType>
	Stage?: StageResolvers<ContextType>
	TruncateResponse?: TruncateResponseResolvers<ContextType>
	UpdateEvent?: UpdateEventResolvers<ContextType>
}

