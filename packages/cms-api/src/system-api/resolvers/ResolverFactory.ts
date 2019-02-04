import StagesQueryResolver from './query/StagesQueryResolver'
import DiffQueryResolver from './query/DiffQueryResolver'
import { Event, EventType } from '../schema/types'
import { assertNever } from 'cms-common'
import ResolverContext from './ResolverContext'
import { GraphQLResolveInfo } from 'graphql'
import { IResolvers } from 'graphql-tools'
import ReleaseMutationResolver from './mutation/ReleaseMutationResolver'

class ResolverFactory {
	public constructor(
		private readonly stagesQueryResolver: StagesQueryResolver,
		private readonly diffQueryResolver: DiffQueryResolver,
		private readonly releaseMutationResolver: ReleaseMutationResolver
	) {}

	create(): IResolvers {
		return {
			Event: {
				__resolveType: (obj: Event) => {
					switch (obj.type) {
						case EventType.CREATE:
							return 'CreateEvent'
						case EventType.UPDATE:
							return 'UpdateEvent'
						case EventType.DELETE:
							return 'DeleteEvent'
						case EventType.RUN_MIGRATION:
							return 'RunMigrationEvent'
						case null:
						case undefined:
							return null
						default:
							assertNever(obj.type)
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
