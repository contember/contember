type Maybe<T> = T | null
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: string
	String: string
	Boolean: boolean
	Int: number
	Float: number
}

export type CreateEvent = Event & {
	readonly id: Scalars['String']
	readonly dependencies: ReadonlyArray<Scalars['String']>
	readonly type?: Maybe<EventType>
	readonly description: Scalars['String']
	readonly allowed: Scalars['Boolean']
	readonly entity: Scalars['String']
	readonly rowId: Scalars['String']
}

export type DeleteEvent = Event & {
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
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<DiffErrorCode>
	readonly result?: Maybe<DiffResult>
}

export type DiffResult = {
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
	readonly release: ReleaseResponse
}

export type MutationReleaseArgs = {
	baseStage: Scalars['String']
	headStage: Scalars['String']
	events: ReadonlyArray<Scalars['String']>
}

export type Query = {
	readonly stages: ReadonlyArray<Stage>
	readonly diff: DiffResponse
}

export type QueryDiffArgs = {
	baseStage: Scalars['String']
	headStage: Scalars['String']
	filter?: Maybe<ReadonlyArray<DiffFilter>>
}

export enum ReleaseErrorCode {
	MissingDependency = 'MISSING_DEPENDENCY',
	Forbidden = 'FORBIDDEN',
}

export type ReleaseResponse = {
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<ReleaseErrorCode>
}

export type RunMigrationEvent = Event & {
	readonly id: Scalars['String']
	readonly dependencies: ReadonlyArray<Scalars['String']>
	readonly type?: Maybe<EventType>
	readonly description: Scalars['String']
	readonly allowed: Scalars['Boolean']
	readonly version: Scalars['String']
}

export type Stage = {
	readonly id: Scalars['String']
	readonly name: Scalars['String']
	readonly slug: Scalars['String']
}

export type UpdateEvent = Event & {
	readonly id: Scalars['String']
	readonly dependencies: ReadonlyArray<Scalars['String']>
	readonly type?: Maybe<EventType>
	readonly description: Scalars['String']
	readonly allowed: Scalars['Boolean']
	readonly entity: Scalars['String']
	readonly rowId: Scalars['String']
	readonly fields: ReadonlyArray<Scalars['String']>
}

import { GraphQLResolveInfo } from 'graphql'

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo
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
	info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo
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
	info: GraphQLResolveInfo
) => Maybe<TTypes>

export type NextResolverFn<T> = () => Promise<T>

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
	next: NextResolverFn<TResult>,
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo
) => TResult | Promise<TResult>

export type CreateEventResolvers<Context = any, ParentType = CreateEvent> = {
	id?: Resolver<Scalars['String'], ParentType, Context>
	dependencies?: Resolver<ReadonlyArray<Scalars['String']>, ParentType, Context>
	type?: Resolver<Maybe<EventType>, ParentType, Context>
	description?: Resolver<Scalars['String'], ParentType, Context>
	allowed?: Resolver<Scalars['Boolean'], ParentType, Context>
	entity?: Resolver<Scalars['String'], ParentType, Context>
	rowId?: Resolver<Scalars['String'], ParentType, Context>
}

export type DeleteEventResolvers<Context = any, ParentType = DeleteEvent> = {
	id?: Resolver<Scalars['String'], ParentType, Context>
	dependencies?: Resolver<ReadonlyArray<Scalars['String']>, ParentType, Context>
	type?: Resolver<Maybe<EventType>, ParentType, Context>
	description?: Resolver<Scalars['String'], ParentType, Context>
	allowed?: Resolver<Scalars['Boolean'], ParentType, Context>
	entity?: Resolver<Scalars['String'], ParentType, Context>
	rowId?: Resolver<Scalars['String'], ParentType, Context>
}

export type DiffResponseResolvers<Context = any, ParentType = DiffResponse> = {
	ok?: Resolver<Scalars['Boolean'], ParentType, Context>
	errors?: Resolver<ReadonlyArray<DiffErrorCode>, ParentType, Context>
	result?: Resolver<Maybe<DiffResult>, ParentType, Context>
}

export type DiffResultResolvers<Context = any, ParentType = DiffResult> = {
	base?: Resolver<Stage, ParentType, Context>
	head?: Resolver<Stage, ParentType, Context>
	events?: Resolver<ReadonlyArray<Event>, ParentType, Context>
}

export type EventResolvers<Context = any, ParentType = Event> = {
	__resolveType: TypeResolveFn<'UpdateEvent' | 'DeleteEvent' | 'CreateEvent' | 'RunMigrationEvent', ParentType, Context>
	id?: Resolver<Scalars['String'], ParentType, Context>
	dependencies?: Resolver<ReadonlyArray<Scalars['String']>, ParentType, Context>
	description?: Resolver<Scalars['String'], ParentType, Context>
	allowed?: Resolver<Scalars['Boolean'], ParentType, Context>
	type?: Resolver<Maybe<EventType>, ParentType, Context>
}

export type MutationResolvers<Context = any, ParentType = Mutation> = {
	release?: Resolver<ReleaseResponse, ParentType, Context, MutationReleaseArgs>
}

export type QueryResolvers<Context = any, ParentType = Query> = {
	stages?: Resolver<ReadonlyArray<Stage>, ParentType, Context>
	diff?: Resolver<DiffResponse, ParentType, Context, QueryDiffArgs>
}

export type ReleaseResponseResolvers<Context = any, ParentType = ReleaseResponse> = {
	ok?: Resolver<Scalars['Boolean'], ParentType, Context>
	errors?: Resolver<ReadonlyArray<ReleaseErrorCode>, ParentType, Context>
}

export type RunMigrationEventResolvers<Context = any, ParentType = RunMigrationEvent> = {
	id?: Resolver<Scalars['String'], ParentType, Context>
	dependencies?: Resolver<ReadonlyArray<Scalars['String']>, ParentType, Context>
	type?: Resolver<Maybe<EventType>, ParentType, Context>
	description?: Resolver<Scalars['String'], ParentType, Context>
	allowed?: Resolver<Scalars['Boolean'], ParentType, Context>
	version?: Resolver<Scalars['String'], ParentType, Context>
}

export type StageResolvers<Context = any, ParentType = Stage> = {
	id?: Resolver<Scalars['String'], ParentType, Context>
	name?: Resolver<Scalars['String'], ParentType, Context>
	slug?: Resolver<Scalars['String'], ParentType, Context>
}

export type UpdateEventResolvers<Context = any, ParentType = UpdateEvent> = {
	id?: Resolver<Scalars['String'], ParentType, Context>
	dependencies?: Resolver<ReadonlyArray<Scalars['String']>, ParentType, Context>
	type?: Resolver<Maybe<EventType>, ParentType, Context>
	description?: Resolver<Scalars['String'], ParentType, Context>
	allowed?: Resolver<Scalars['Boolean'], ParentType, Context>
	entity?: Resolver<Scalars['String'], ParentType, Context>
	rowId?: Resolver<Scalars['String'], ParentType, Context>
	fields?: Resolver<ReadonlyArray<Scalars['String']>, ParentType, Context>
}

export type Resolvers<Context = any> = {
	CreateEvent?: CreateEventResolvers<Context>
	DeleteEvent?: DeleteEventResolvers<Context>
	DiffResponse?: DiffResponseResolvers<Context>
	DiffResult?: DiffResultResolvers<Context>
	Event?: EventResolvers
	Mutation?: MutationResolvers<Context>
	Query?: QueryResolvers<Context>
	ReleaseResponse?: ReleaseResponseResolvers<Context>
	RunMigrationEvent?: RunMigrationEventResolvers<Context>
	Stage?: StageResolvers<Context>
	UpdateEvent?: UpdateEventResolvers<Context>
}

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<Context = any> = Resolvers<Context>
