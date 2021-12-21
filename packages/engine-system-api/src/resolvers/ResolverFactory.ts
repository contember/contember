import { EventsQueryResolver, ExecutedMigrationsQueryResolver, StagesQueryResolver } from './query'
import { Event, EventType, Resolvers } from '../schema'
import { assertNever } from '../utils'
import { MigrateMutationResolver, MigrationAlterMutationResolver, TruncateMutationResolver } from './mutation'
import { DateTimeType, JSONType } from '@contember/graphql-utils'
import { EventOldValuesResolver } from './types'

export class ResolverFactory {
	public constructor(
		private readonly stagesQueryResolver: StagesQueryResolver,
		private readonly executedMigrationsQueryResolver: ExecutedMigrationsQueryResolver,
		private readonly migrateMutationResolver: MigrateMutationResolver,
		private readonly truncateMutationResolver: TruncateMutationResolver,
		private readonly migrationAlterMutationResolver: MigrationAlterMutationResolver,
		private readonly eventsQueryResolver: EventsQueryResolver,
		private readonly eventOldValuesResolver: EventOldValuesResolver,
	) {}

	create(debugMode: boolean): Resolvers {
		const resolvers: Resolvers & Required<Pick<Resolvers, 'Mutation'>> = {
			DateTime: DateTimeType,
			Json: JSONType,
			Event: {
				__resolveType: (obj: Event) => {
					switch (obj.type) {
						case EventType.Create:
							return 'CreateEvent'
						case EventType.Update:
							return 'UpdateEvent'
						case EventType.Delete:
							return 'DeleteEvent'
						case null:
						case undefined:
							return null
						default:
							return assertNever(obj.type)
					}
				},
			},
			Query: {
				stages: this.stagesQueryResolver.stages.bind(this.stagesQueryResolver),
				executedMigrations: this.executedMigrationsQueryResolver.executedMigrations.bind(this.executedMigrationsQueryResolver),
				events: this.eventsQueryResolver.events.bind(this.eventsQueryResolver),
			},
			Mutation: {
				migrate: this.migrateMutationResolver.migrate.bind(this.migrateMutationResolver),
			},
			DeleteEvent: {
				oldValues: this.eventOldValuesResolver.oldValues.bind(this.eventOldValuesResolver),
			},
			UpdateEvent: {
				oldValues: this.eventOldValuesResolver.oldValues.bind(this.eventOldValuesResolver),
			},
		}
		if (debugMode) {
			resolvers.Mutation.truncate = this.truncateMutationResolver.truncate.bind(this.truncateMutationResolver)
			resolvers.Mutation.migrationDelete = this.migrationAlterMutationResolver.migrationDelete.bind(this.migrationAlterMutationResolver)
			resolvers.Mutation.migrationModify = this.migrationAlterMutationResolver.migrationModify.bind(this.migrationAlterMutationResolver)
			resolvers.Mutation.forceMigrate = this.migrateMutationResolver.migrateForce.bind(this.migrateMutationResolver)
		}
		return resolvers
	}
}
