import { DiffQueryResolver, StagesQueryResolver } from './query'
import { DiffEvent, DiffEventType, HistoryEvent, HistoryEventType, Resolvers } from '../schema'
import { assertNever } from '../utils'
import { ResolverContext } from './ResolverContext'
import { GraphQLResolveInfo, GraphQLScalarType, Kind, ValueNode } from 'graphql'
import { MigrateMutationResolver, RebaseAllMutationResolver, ReleaseMutationResolver } from './mutation'
import { ReleaseTreeMutationResolver } from './mutation/ReleaseTreeMutationResolver'
import { HistoryQueryResolver } from './query/HistoryQueryResolver'
import { HistoryEventTypeResolver } from './types/HistoryEventTypeResolver'
import Maybe from 'graphql/tsutils/Maybe'
import { JSONValue } from '../utils/json'
import { ExecutedMigrationsQueryResolver } from './query/ExecutedMigrationsQueryResolver'

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
		private readonly historyEventTypeResolver: HistoryEventTypeResolver,
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
			Json: new GraphQLScalarType({
				name: 'Json',
				description: 'Json custom scalar type',
				serialize(value) {
					return value
				},
				parseValue(value) {
					return value
				},
				parseLiteral(ast, variables) {
					const parseLiteral = (ast: ValueNode, variables: Maybe<{ [key: string]: any }>): JSONValue => {
						switch (ast.kind) {
							case Kind.STRING:
								return ast.value
							case Kind.BOOLEAN:
								return ast.value
							case Kind.FLOAT:
								return parseFloat(ast.value)
							case Kind.INT:
								return Number(ast.value)
							case Kind.LIST:
								return ast.values.map(it => parseLiteral(it, variables))
							case Kind.OBJECT:
								return Object.fromEntries(ast.fields.map(it => [it.name.value, parseLiteral(it.value, variables)]))
							case Kind.NULL:
								return null
							case Kind.VARIABLE:
								return variables?.[ast.name.value] || undefined
							default:
								throw new TypeError()
						}
					}
					return parseLiteral(ast, variables)
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
		}
	}
}

namespace ResolverFactory {
	export type FieldResolverArgs = {
		[argument: string]: any
	}
}

export { ResolverFactory }
