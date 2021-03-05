import { DiffQueryResolver, ExecutedMigrationsQueryResolver, HistoryQueryResolver, StagesQueryResolver } from './query'
import { DiffEvent, DiffEventType, HistoryEvent, HistoryEventType, Resolvers } from '../schema'
import { assertNever } from '../utils'
import { ResolverContext } from './ResolverContext'
import { GraphQLResolveInfo } from 'graphql'
import {
	MigrateMutationResolver,
	RebaseAllMutationResolver,
	ReleaseMutationResolver,
	ReleaseTreeMutationResolver,
	TruncateMutationResolver,
} from './mutation'
import { DiffEventTypeResolver, HistoryEventTypeResolver } from './types'
import { DateTimeType, JSONType } from '@contember/graphql-utils'
import { MigrationAlterMutationResolver } from './mutation/MigrationAlterMutationResolver'

class ResolverFactory {
	public constructor(
		private readonly stagesQueryResolver: StagesQueryResolver,
		private readonly executedMigrationsQueryResolver: ExecutedMigrationsQueryResolver,
		private readonly diffQueryResolver: DiffQueryResolver,
		private readonly historyQueryResolver: HistoryQueryResolver,
		private readonly releaseMutationResolver: ReleaseMutationResolver,
		private readonly rebaseMutationResolver: RebaseAllMutationResolver,
		private readonly migrateMutationResolver: MigrateMutationResolver,
		private readonly releaseTreeMutationResolver: ReleaseTreeMutationResolver,
		private readonly truncateMutationResolver: TruncateMutationResolver,
		private readonly historyEventTypeResolver: HistoryEventTypeResolver,
		private readonly diffEventTypeResolver: DiffEventTypeResolver,
		private readonly migrationAlterMutationResolver: MigrationAlterMutationResolver,
	) {}

	create(debugMode: boolean): Resolvers {
		const resolvers: Resolvers & Required<Pick<Resolvers, 'Mutation'>> = {
			DateTime: DateTimeType,
			Json: JSONType,
			DiffEvent: {
				__resolveType: (obj: DiffEvent) => {
					switch (obj.type) {
						case DiffEventType.Create:
							return 'DiffCreateEvent'
						case DiffEventType.Update:
							return 'DiffUpdateEvent'
						case DiffEventType.Delete:
							return 'DiffDeleteEvent'
						case null:
						case undefined:
							return null
						default:
							return assertNever(obj.type)
					}
				},
			},
			HistoryEvent: {
				__resolveType: (obj: HistoryEvent) => {
					switch (obj.type) {
						case HistoryEventType.Create:
							return 'HistoryCreateEvent'
						case HistoryEventType.Update:
							return 'HistoryUpdateEvent'
						case HistoryEventType.Delete:
							return 'HistoryDeleteEvent'
						case HistoryEventType.RunMigration:
							return 'HistoryRunMigrationEvent'
						case null:
						case undefined:
							return null
						default:
							return assertNever(obj.type)
					}
				},
			},
			Query: {
				stages: (parent: any, args: any, context: ResolverContext, info: GraphQLResolveInfo) =>
					this.stagesQueryResolver.stages(parent, args, context, info),
				executedMigrations: (parent: any, args: any, context: ResolverContext, info: GraphQLResolveInfo) =>
					this.executedMigrationsQueryResolver.executedMigrations(parent, args, context, info),
				diff: (parent: any, args: any, context: ResolverContext, info: GraphQLResolveInfo) =>
					this.diffQueryResolver.diff(parent, args, context, info),
				history: (parent: any, args: any, context: ResolverContext, info: GraphQLResolveInfo) =>
					this.historyQueryResolver.history(parent, args, context, info),
			},
			Mutation: {
				release: (parent: any, args: any, context: ResolverContext, info: GraphQLResolveInfo) =>
					this.releaseMutationResolver.release(parent, args, context, info),
				releaseTree: (parent: any, args: any, context: ResolverContext, info: GraphQLResolveInfo) =>
					this.releaseTreeMutationResolver.releaseTree(parent, args, context, info),
				rebaseAll: (parent: any, args: any, context: ResolverContext, info: GraphQLResolveInfo) =>
					this.rebaseMutationResolver.rebaseAll(parent, args, context, info),
				migrate: (parent: any, args: any, context: ResolverContext, info: GraphQLResolveInfo) =>
					this.migrateMutationResolver.migrate(parent, args, context, info),
			},
			HistoryDeleteEvent: {
				oldValues: (parent: any, args: any, context: ResolverContext, info: GraphQLResolveInfo) =>
					this.historyEventTypeResolver.oldValues(parent, args, context),
			},
			HistoryUpdateEvent: {
				oldValues: (parent: any, args: any, context: ResolverContext, info: GraphQLResolveInfo) =>
					this.historyEventTypeResolver.oldValues(parent, args, context),
			},
			DiffDeleteEvent: {
				oldValues: (parent: any, args: any, context: ResolverContext, info: GraphQLResolveInfo) =>
					this.diffEventTypeResolver.oldValues(parent, args, context),
			},
			DiffUpdateEvent: {
				oldValues: (parent: any, args: any, context: ResolverContext, info: GraphQLResolveInfo) =>
					this.diffEventTypeResolver.oldValues(parent, args, context),
			},
		}
		if (debugMode) {
			resolvers.Mutation.truncate = this.truncateMutationResolver.truncate.bind(this.truncateMutationResolver)
			resolvers.Mutation.migrationDelete = this.migrationAlterMutationResolver.migrationDelete.bind(
				this.migrationAlterMutationResolver,
			)
			resolvers.Mutation.migrationModify = this.migrationAlterMutationResolver.migrationModify.bind(
				this.migrationAlterMutationResolver,
			)
			resolvers.Mutation.forceMigrate = this.migrateMutationResolver.migrateForce.bind(this.migrateMutationResolver)
		}
		return resolvers
	}
}

namespace ResolverFactory {
	export type FieldResolverArgs = {
		[argument: string]: any
	}
}

export { ResolverFactory }
