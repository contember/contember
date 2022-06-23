import { EventsQueryResolver, ExecutedMigrationsQueryResolver, StagesQueryResolver } from './query/index.js'
import { Event, EventType, Resolvers } from '../schema/index.js'
import { assertNever } from '../utils/index.js'
import { MigrateMutationResolver, MigrationAlterMutationResolver, TruncateMutationResolver } from './mutation/index.js'
import { DateTimeType, JSONType } from '@contember/graphql-utils'
import { EventOldValuesResolver } from './types/index.js'
import { GraphQLError, GraphQLScalarType, Kind } from 'graphql'

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
			PrimaryKey: PrimaryKeyType,
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

const parseValue = (value: any)  => {
	if ((typeof value === 'string' && value !== '') || typeof value === 'number' && isFinite(value) && Math.floor(value) === value) {
		return value
	}
	throw new GraphQLError('PrimaryKey cannot represent value: ' + JSON.stringify(value))
}
export const PrimaryKeyType = new GraphQLScalarType({
	name: 'PrimaryKey',
	description: 'PrimaryKey custom scalar type. Can be Int or String',
	serialize: parseValue,
	parseValue: parseValue,
	parseLiteral(ast) {
		if (ast.kind === Kind.STRING) {
			return ast.value
		}
		if (ast.kind === Kind.INT) {
			return Number.parseInt(ast.value, 10)
		}
		return null
	},
})
