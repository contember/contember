import { Config } from 'apollo-server-core'
import StagesQueryResolver from './query/StagesQueryResolver'
import DiffQueryResolver from './query/DiffQueryResolver'
import { Event, EventType } from '../schema/types'
import { assertNever } from 'cms-common'

class ResolverFactory {
	public constructor(
		private readonly stagesQueryResolver: StagesQueryResolver,
		private readonly diffQueryResolver: DiffQueryResolver
	) {}

	create(): Config['resolvers'] {
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
				stages: this.stagesQueryResolver.stages.bind(this.stagesQueryResolver),
				diff: this.diffQueryResolver.diff.bind(this.diffQueryResolver),
			},
			Mutation: {},
		}
	}
}

namespace ResolverFactory {
	export type FieldResolverArgs = {
		[argument: string]: any
	}
}

export default ResolverFactory
