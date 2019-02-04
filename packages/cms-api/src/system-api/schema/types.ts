/* tslint:disable */
import { GraphQLResolveInfo } from 'graphql'

export type Resolver<Result, Args = any> = (
	parent: any,
	args: Args,
	context: any,
	info: GraphQLResolveInfo
) => Promise<Result> | Result

export interface Event {
	readonly id: string
	readonly dependencies: ReadonlyArray<string>
	readonly description: string
	readonly allowed: boolean
	readonly type?: EventType | null
}

export interface Query {
	readonly stages: ReadonlyArray<Stage>
	readonly diff: DiffResponse
}

export interface Stage {
	readonly id: string
	readonly name: string
	readonly slug: string
}

export interface DiffResponse {
	readonly ok: boolean
	readonly errors: ReadonlyArray<DiffErrorCode>
	readonly result?: DiffResult | null
}

export interface DiffResult {
	readonly base: Stage
	readonly head: Stage
	readonly events: ReadonlyArray<Event>
}

export interface Mutation {
	readonly release: ReleaseResponse
}

export interface ReleaseResponse {
	readonly ok: boolean
	readonly errors: ReadonlyArray<ReleaseErrorCode>
}

export interface UpdateEvent extends Event {
	readonly id: string
	readonly dependencies: ReadonlyArray<string>
	readonly type?: EventType | null
	readonly description: string
	readonly allowed: boolean
	readonly entity: string
	readonly rowId: string
	readonly fields: ReadonlyArray<string>
}

export interface DeleteEvent extends Event {
	readonly id: string
	readonly dependencies: ReadonlyArray<string>
	readonly type?: EventType | null
	readonly description: string
	readonly allowed: boolean
	readonly entity: string
	readonly rowId: string
}

export interface CreateEvent extends Event {
	readonly id: string
	readonly dependencies: ReadonlyArray<string>
	readonly type?: EventType | null
	readonly description: string
	readonly allowed: boolean
	readonly entity: string
	readonly rowId: string
}

export interface RunMigrationEvent extends Event {
	readonly id: string
	readonly dependencies: ReadonlyArray<string>
	readonly type?: EventType | null
	readonly description: string
	readonly allowed: boolean
	readonly version: string
}

export interface DiffFilter {
	readonly entity: string
	readonly id: string
}
export interface DiffQueryArgs {
	baseStage: string
	headStage: string
	filter?: ReadonlyArray<DiffFilter> | null
}
export interface ReleaseMutationArgs {
	baseStage: string
	headStage: string
	events: ReadonlyArray<string>
}

export enum DiffErrorCode {
	BASE_NOT_FOUND = 'BASE_NOT_FOUND',
	HEAD_NOT_FOUND = 'HEAD_NOT_FOUND',
	NOT_REBASED = 'NOT_REBASED',
}

export enum EventType {
	UPDATE = 'UPDATE',
	DELETE = 'DELETE',
	CREATE = 'CREATE',
	RUN_MIGRATION = 'RUN_MIGRATION',
}

export enum ReleaseErrorCode {
	MISSING_DEPENDENCY = 'MISSING_DEPENDENCY',
	FORBIDDEN = 'FORBIDDEN',
}

export namespace QueryResolvers {
	export interface Resolvers {
		stages?: StagesResolver
		diff?: DiffResolver
	}

	export type StagesResolver<R = ReadonlyArray<Stage>> = Resolver<R>
	export type DiffResolver<R = DiffResponse> = Resolver<R, DiffArgs>
	export interface DiffArgs {
		baseStage: string
		headStage: string
		filter?: ReadonlyArray<DiffFilter> | null
	}
}

export namespace StageResolvers {
	export interface Resolvers {
		id?: IdResolver
		name?: NameResolver
		slug?: SlugResolver
	}

	export type IdResolver<R = string> = Resolver<R>
	export type NameResolver<R = string> = Resolver<R>
	export type SlugResolver<R = string> = Resolver<R>
}

export namespace DiffResponseResolvers {
	export interface Resolvers {
		ok?: OkResolver
		errors?: ErrorsResolver
		result?: ResultResolver
	}

	export type OkResolver<R = boolean> = Resolver<R>
	export type ErrorsResolver<R = ReadonlyArray<DiffErrorCode>> = Resolver<R>
	export type ResultResolver<R = DiffResult | null> = Resolver<R>
}

export namespace DiffResultResolvers {
	export interface Resolvers {
		base?: BaseResolver
		head?: HeadResolver
		events?: EventsResolver
	}

	export type BaseResolver<R = Stage> = Resolver<R>
	export type HeadResolver<R = Stage> = Resolver<R>
	export type EventsResolver<R = ReadonlyArray<Event>> = Resolver<R>
}

export namespace MutationResolvers {
	export interface Resolvers {
		release?: ReleaseResolver
	}

	export type ReleaseResolver<R = ReleaseResponse> = Resolver<R, ReleaseArgs>
	export interface ReleaseArgs {
		baseStage: string
		headStage: string
		events: ReadonlyArray<string>
	}
}

export namespace ReleaseResponseResolvers {
	export interface Resolvers {
		ok?: OkResolver
		errors?: ErrorsResolver
	}

	export type OkResolver<R = boolean> = Resolver<R>
	export type ErrorsResolver<R = ReadonlyArray<ReleaseErrorCode>> = Resolver<R>
}

export namespace UpdateEventResolvers {
	export interface Resolvers {
		id?: IdResolver
		dependencies?: DependenciesResolver
		type?: TypeResolver
		description?: DescriptionResolver
		allowed?: AllowedResolver
		entity?: EntityResolver
		rowId?: RowIdResolver
		fields?: FieldsResolver
	}

	export type IdResolver<R = string> = Resolver<R>
	export type DependenciesResolver<R = ReadonlyArray<string>> = Resolver<R>
	export type TypeResolver<R = EventType | null> = Resolver<R>
	export type DescriptionResolver<R = string> = Resolver<R>
	export type AllowedResolver<R = boolean> = Resolver<R>
	export type EntityResolver<R = string> = Resolver<R>
	export type RowIdResolver<R = string> = Resolver<R>
	export type FieldsResolver<R = ReadonlyArray<string>> = Resolver<R>
}

export namespace DeleteEventResolvers {
	export interface Resolvers {
		id?: IdResolver
		dependencies?: DependenciesResolver
		type?: TypeResolver
		description?: DescriptionResolver
		allowed?: AllowedResolver
		entity?: EntityResolver
		rowId?: RowIdResolver
	}

	export type IdResolver<R = string> = Resolver<R>
	export type DependenciesResolver<R = ReadonlyArray<string>> = Resolver<R>
	export type TypeResolver<R = EventType | null> = Resolver<R>
	export type DescriptionResolver<R = string> = Resolver<R>
	export type AllowedResolver<R = boolean> = Resolver<R>
	export type EntityResolver<R = string> = Resolver<R>
	export type RowIdResolver<R = string> = Resolver<R>
}

export namespace CreateEventResolvers {
	export interface Resolvers {
		id?: IdResolver
		dependencies?: DependenciesResolver
		type?: TypeResolver
		description?: DescriptionResolver
		allowed?: AllowedResolver
		entity?: EntityResolver
		rowId?: RowIdResolver
	}

	export type IdResolver<R = string> = Resolver<R>
	export type DependenciesResolver<R = ReadonlyArray<string>> = Resolver<R>
	export type TypeResolver<R = EventType | null> = Resolver<R>
	export type DescriptionResolver<R = string> = Resolver<R>
	export type AllowedResolver<R = boolean> = Resolver<R>
	export type EntityResolver<R = string> = Resolver<R>
	export type RowIdResolver<R = string> = Resolver<R>
}

export namespace RunMigrationEventResolvers {
	export interface Resolvers {
		id?: IdResolver
		dependencies?: DependenciesResolver
		type?: TypeResolver
		description?: DescriptionResolver
		allowed?: AllowedResolver
		version?: VersionResolver
	}

	export type IdResolver<R = string> = Resolver<R>
	export type DependenciesResolver<R = ReadonlyArray<string>> = Resolver<R>
	export type TypeResolver<R = EventType | null> = Resolver<R>
	export type DescriptionResolver<R = string> = Resolver<R>
	export type AllowedResolver<R = boolean> = Resolver<R>
	export type VersionResolver<R = string> = Resolver<R>
}
