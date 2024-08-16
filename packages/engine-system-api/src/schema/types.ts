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
	Schema: { input: any; output: any }
	DateTime: { input: Date; output: Date }
	Json: { input: unknown; output: unknown }
	PrimaryKey: { input: string | number; output: string | number }
}

export type ContentMigration = {
	readonly checkMutationResult?: InputMaybe<Scalars['Boolean']['input']>
	readonly query: Scalars['String']['input']
	readonly stage?: InputMaybe<Scalars['String']['input']>
	readonly variables?: InputMaybe<Scalars['Json']['input']>
}

export type CreateEvent = Event & {
	readonly __typename?: 'CreateEvent'
	readonly appliedAt: Scalars['DateTime']['output']
	readonly createdAt: Scalars['DateTime']['output']
	readonly description: Scalars['String']['output']
	readonly id: Scalars['String']['output']
	readonly identityDescription: Scalars['String']['output']
	readonly identityId: Scalars['String']['output']
	readonly newValues: Scalars['Json']['output']
	readonly primaryKey: ReadonlyArray<Scalars['PrimaryKey']['output']>
	readonly tableName: Scalars['String']['output']
	readonly transactionId: Scalars['String']['output']
	readonly type: EventType
}

export type DeleteEvent = Event & {
	readonly __typename?: 'DeleteEvent'
	readonly appliedAt: Scalars['DateTime']['output']
	readonly createdAt: Scalars['DateTime']['output']
	readonly description: Scalars['String']['output']
	readonly id: Scalars['String']['output']
	readonly identityDescription: Scalars['String']['output']
	readonly identityId: Scalars['String']['output']
	readonly oldValues: Scalars['Json']['output']
	readonly primaryKey: ReadonlyArray<Scalars['PrimaryKey']['output']>
	readonly tableName: Scalars['String']['output']
	readonly transactionId: Scalars['String']['output']
	readonly type: EventType
}

export type Event = {
	readonly appliedAt: Scalars['DateTime']['output']
	readonly createdAt: Scalars['DateTime']['output']
	readonly description: Scalars['String']['output']
	readonly id: Scalars['String']['output']
	readonly identityDescription: Scalars['String']['output']
	readonly identityId: Scalars['String']['output']
	readonly primaryKey: ReadonlyArray<Scalars['PrimaryKey']['output']>
	readonly tableName: Scalars['String']['output']
	readonly transactionId: Scalars['String']['output']
	readonly type: EventType
}

export type EventFilterRow = {
	readonly primaryKey: ReadonlyArray<InputMaybe<Scalars['PrimaryKey']['input']>>
	readonly tableName: Scalars['String']['input']
}

export enum EventType {
	Create = 'CREATE',
	Delete = 'DELETE',
	Update = 'UPDATE'
}

export type EventsArgs = {
	readonly filter?: InputMaybe<EventsFilter>
	/** Max 10000 */
	readonly limit?: InputMaybe<Scalars['Int']['input']>
	readonly offset?: InputMaybe<Scalars['Int']['input']>
	readonly order?: InputMaybe<EventsOrder>
	readonly stage?: InputMaybe<Scalars['String']['input']>
}

export type EventsFilter = {
	readonly appliedAt?: InputMaybe<EventsFilterDate>
	readonly createdAt?: InputMaybe<EventsFilterDate>
	readonly identities?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>
	readonly rows?: InputMaybe<ReadonlyArray<EventFilterRow>>
	readonly tables?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>
	readonly transactions?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>
	readonly types?: InputMaybe<ReadonlyArray<EventType>>
}

export type EventsFilterDate = {
	readonly from?: InputMaybe<Scalars['DateTime']['input']>
	readonly to?: InputMaybe<Scalars['DateTime']['input']>
}

export enum EventsOrder {
	AppliedAtAsc = 'APPLIED_AT_ASC',
	AppliedAtDesc = 'APPLIED_AT_DESC',
	CreatedAtAsc = 'CREATED_AT_ASC',
	CreatedAtDesc = 'CREATED_AT_DESC'
}

export type ExecutedMigration = {
	readonly __typename?: 'ExecutedMigration'
	readonly checksum?: Maybe<Scalars['String']['output']>
	readonly executedAt: Scalars['DateTime']['output']
	readonly formatVersion?: Maybe<Scalars['Int']['output']>
	readonly modifications?: Maybe<ReadonlyArray<Scalars['Json']['output']>>
	readonly name: Scalars['String']['output']
	readonly version: Scalars['String']['output']
}

export type MigrateError = {
	readonly __typename?: 'MigrateError'
	readonly code: MigrateErrorCode
	readonly developerMessage: Scalars['String']['output']
	readonly migration: Scalars['String']['output']
}

export enum MigrateErrorCode {
	AlreadyExecuted = 'ALREADY_EXECUTED',
	ContentMigrationFailed = 'CONTENT_MIGRATION_FAILED',
	ContentMigrationNotSuccessful = 'CONTENT_MIGRATION_NOT_SUCCESSFUL',
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
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<MigrateResult>
}

export type MigrateResult = {
	readonly __typename?: 'MigrateResult'
	readonly message: Scalars['String']['output']
}

export type Migration = {
	readonly contentMigration?: InputMaybe<ReadonlyArray<ContentMigration>>
	/** @deprecated Use schemaMigration with SCHEMA type */
	readonly formatVersion?: InputMaybe<Scalars['Int']['input']>
	/** @deprecated Use schemaMigration with SCHEMA type */
	readonly modifications?: InputMaybe<ReadonlyArray<Scalars['Json']['input']>>
	readonly name: Scalars['String']['input']
	readonly schemaMigration?: InputMaybe<SchemaMigration>
	/** @deprecated Use schemaMigration with SCHEMA type */
	readonly skippedErrors?: InputMaybe<ReadonlyArray<MigrationSkippedError>>
	readonly type?: InputMaybe<MigrationType>
	readonly version: Scalars['String']['input']
}

export type MigrationDeleteError = {
	readonly __typename?: 'MigrationDeleteError'
	readonly code: MigrationDeleteErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export enum MigrationDeleteErrorCode {
	InvalidFormat = 'INVALID_FORMAT',
	NotFound = 'NOT_FOUND'
}

export type MigrationDeleteResponse = {
	readonly __typename?: 'MigrationDeleteResponse'
	readonly error?: Maybe<MigrationDeleteError>
	readonly ok: Scalars['Boolean']['output']
}

export type MigrationModification = {
	readonly formatVersion?: InputMaybe<Scalars['Int']['input']>
	readonly modifications?: InputMaybe<ReadonlyArray<Scalars['Json']['input']>>
	readonly name?: InputMaybe<Scalars['String']['input']>
	readonly version?: InputMaybe<Scalars['String']['input']>
}

export type MigrationModifyError = {
	readonly __typename?: 'MigrationModifyError'
	readonly code: MigrationModifyErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export enum MigrationModifyErrorCode {
	NotFound = 'NOT_FOUND'
}

export type MigrationModifyResponse = {
	readonly __typename?: 'MigrationModifyResponse'
	readonly error?: Maybe<MigrationModifyError>
	readonly ok: Scalars['Boolean']['output']
}

export type MigrationSkippedError = {
	readonly code: Scalars['String']['input']
	readonly path?: InputMaybe<Scalars['String']['input']>
}

export enum MigrationType {
	Content = 'CONTENT',
	Schema = 'SCHEMA'
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
	migration: Scalars['String']['input']
}


export type MutationMigrationModifyArgs = {
	migration: Scalars['String']['input']
	modification: MigrationModification
}

export type Query = {
	readonly __typename?: 'Query'
	readonly events: ReadonlyArray<Event>
	readonly executedMigrations: ReadonlyArray<ExecutedMigration>
	readonly schema: Scalars['Schema']['output']
	readonly stages: ReadonlyArray<Stage>
}


export type QueryEventsArgs = {
	args?: InputMaybe<EventsArgs>
}


export type QueryExecutedMigrationsArgs = {
	version?: InputMaybe<Scalars['String']['input']>
}

export type SchemaMigration = {
	readonly formatVersion: Scalars['Int']['input']
	readonly modifications: ReadonlyArray<Scalars['Json']['input']>
	readonly skippedErrors?: InputMaybe<ReadonlyArray<MigrationSkippedError>>
}

export type Stage = {
	readonly __typename?: 'Stage'
	readonly id: Scalars['String']['output']
	readonly name: Scalars['String']['output']
	readonly slug: Scalars['String']['output']
}

export type TruncateResponse = {
	readonly __typename?: 'TruncateResponse'
	readonly ok: Scalars['Boolean']['output']
}

export type UpdateEvent = Event & {
	readonly __typename?: 'UpdateEvent'
	readonly appliedAt: Scalars['DateTime']['output']
	readonly createdAt: Scalars['DateTime']['output']
	readonly description: Scalars['String']['output']
	readonly diffValues: Scalars['Json']['output']
	readonly id: Scalars['String']['output']
	readonly identityDescription: Scalars['String']['output']
	readonly identityId: Scalars['String']['output']
	readonly oldValues: Scalars['Json']['output']
	readonly primaryKey: ReadonlyArray<Scalars['PrimaryKey']['output']>
	readonly tableName: Scalars['String']['output']
	readonly transactionId: Scalars['String']['output']
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


/** Mapping of interface types */
export type ResolversInterfaceTypes<RefType extends Record<string, unknown>> = {
	Event: (CreateEvent) | (DeleteEvent) | (UpdateEvent)
}

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
	Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>
	ContentMigration: ContentMigration
	Schema: ResolverTypeWrapper<Scalars['Schema']['output']>
	CreateEvent: ResolverTypeWrapper<CreateEvent>
	DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>
	DeleteEvent: ResolverTypeWrapper<DeleteEvent>
	Event: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['Event']>
	EventFilterRow: EventFilterRow
	EventType: EventType
	EventsArgs: EventsArgs
	EventsFilter: EventsFilter
	EventsFilterDate: EventsFilterDate
	EventsOrder: EventsOrder
	ExecutedMigration: ResolverTypeWrapper<ExecutedMigration>
	Int: ResolverTypeWrapper<Scalars['Int']['output']>
	Json: ResolverTypeWrapper<Scalars['Json']['output']>
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
	MigrationSkippedError: MigrationSkippedError
	MigrationType: MigrationType
	Mutation: ResolverTypeWrapper<{}>
	PrimaryKey: ResolverTypeWrapper<Scalars['PrimaryKey']['output']>
	Query: ResolverTypeWrapper<{}>
	SchemaMigration: SchemaMigration
	Stage: ResolverTypeWrapper<Stage>
	String: ResolverTypeWrapper<Scalars['String']['output']>
	TruncateResponse: ResolverTypeWrapper<TruncateResponse>
	UpdateEvent: ResolverTypeWrapper<UpdateEvent>
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
	Boolean: Scalars['Boolean']['output']
	ContentMigration: ContentMigration
	Schema: Scalars['Schema']['output']
	CreateEvent: CreateEvent
	DateTime: Scalars['DateTime']['output']
	DeleteEvent: DeleteEvent
	Event: ResolversInterfaceTypes<ResolversParentTypes>['Event']
	EventFilterRow: EventFilterRow
	EventsArgs: EventsArgs
	EventsFilter: EventsFilter
	EventsFilterDate: EventsFilterDate
	ExecutedMigration: ExecutedMigration
	Int: Scalars['Int']['output']
	Json: Scalars['Json']['output']
	MigrateError: MigrateError
	MigrateResponse: MigrateResponse
	MigrateResult: MigrateResult
	Migration: Migration
	MigrationDeleteError: MigrationDeleteError
	MigrationDeleteResponse: MigrationDeleteResponse
	MigrationModification: MigrationModification
	MigrationModifyError: MigrationModifyError
	MigrationModifyResponse: MigrationModifyResponse
	MigrationSkippedError: MigrationSkippedError
	Mutation: {}
	PrimaryKey: Scalars['PrimaryKey']['output']
	Query: {}
	SchemaMigration: SchemaMigration
	Stage: Stage
	String: Scalars['String']['output']
	TruncateResponse: TruncateResponse
	UpdateEvent: UpdateEvent
}

export interface SchemaScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Schema'], any> {
	name: 'Schema'
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
	checksum?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	executedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	formatVersion?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>
	modifications?: Resolver<Maybe<ReadonlyArray<ResolversTypes['Json']>>, ParentType, ContextType>
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
	schema?: Resolver<ResolversTypes['Schema'], ParentType, ContextType>
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
	Schema?: GraphQLScalarType
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

