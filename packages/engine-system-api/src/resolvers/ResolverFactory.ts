import { DiffQueryResolver, StagesQueryResolver } from './query'
import { HistoryEvent, HistoryEventType, DiffEvent, DiffEventType, Resolvers } from '../schema'
import { assertNever } from '../utils'
import { ResolverContext } from './ResolverContext'
import { GraphQLResolveInfo, GraphQLScalarType, Kind } from 'graphql'
import { MigrateMutationResolver, RebaseAllMutationResolver, ReleaseMutationResolver } from './mutation'
import { ReleaseTreeMutationResolver } from './mutation/ReleaseTreeMutationResolver'
import { HistoryQueryResolver } from './query/HistoryQueryResolver'

class ResolverFactory {
	public constructor(
		private readonly stagesQueryResolver: StagesQueryResolver,
		private readonly diffQueryResolver: DiffQueryResolver,
		private readonly historyQueryResolver: HistoryQueryResolver,
		private readonly releaseMutationResolver: ReleaseMutationResolver,
		private readonly rebaseMutationResolver: RebaseAllMutationResolver,
		private readonly migrateMutationResolver: MigrateMutationResolver,
		private readonly releaseTreeMutationResolver: ReleaseTreeMutationResolver,
	) {}

	create(): Resolvers {
		return {
			DateTime: new GraphQLScalarType({
				name: 'DateTime',
				description: 'DateTime custom scalar type',
				serialize(value) {
					return value instanceof Date ? value.toISOString() : null
				},
				parseValue(value) {
					return new Date(value)
				},
				parseLiteral(ast) {
					if (ast.kind === Kind.STRING) {
						return new Date(ast.value)
					}
					return null
				},
			}),
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
		}
	}
}

namespace ResolverFactory {
	export type FieldResolverArgs = {
		[argument: string]: any
	}
}

export { ResolverFactory }
