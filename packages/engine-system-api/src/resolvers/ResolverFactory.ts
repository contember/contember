import { DiffQueryResolver, StagesQueryResolver } from './query'
import { Event, EventType, Resolvers } from '../schema'
import { assertNever } from '../utils'
import { ResolverContext } from './ResolverContext'
import { GraphQLResolveInfo, GraphQLScalarType, Kind } from 'graphql'
import { MigrateMutationResolver, RebaseAllMutationResolver, ReleaseMutationResolver } from './mutation'

class ResolverFactory {
	public constructor(
		private readonly stagesQueryResolver: StagesQueryResolver,
		private readonly diffQueryResolver: DiffQueryResolver,
		private readonly releaseMutationResolver: ReleaseMutationResolver,
		private readonly rebaseMutationResolver: RebaseAllMutationResolver,
		private readonly migrateMutationResolver: MigrateMutationResolver,
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
			Event: {
				__resolveType: (obj: Event) => {
					switch (obj.type) {
						case EventType.Create:
							return 'CreateEvent'
						case EventType.Update:
							return 'UpdateEvent'
						case EventType.Delete:
							return 'DeleteEvent'
						case EventType.RunMigration:
							return 'RunMigrationEvent'
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
			},
			Mutation: {
				release: (parent: any, args: any, context: ResolverContext, info: GraphQLResolveInfo) =>
					this.releaseMutationResolver.release(parent, args, context, info),
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
