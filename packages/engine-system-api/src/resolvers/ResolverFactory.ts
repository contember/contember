import StagesQueryResolver from './query/StagesQueryResolver'
import DiffQueryResolver from './query/DiffQueryResolver'
import { Event, EventType, Resolvers } from '../schema'
import { assertNever } from '../utils'
import { ResolverContext } from './ResolverContext'
import { GraphQLResolveInfo } from 'graphql'
import ReleaseMutationResolver from './mutation/ReleaseMutationResolver'
import RebaseAllMutationResolver from './mutation/RebaseAllMutationResolver'
import { MigrateMutationResolver } from './mutation/MigrateMutationResolver'

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

export default ResolverFactory
