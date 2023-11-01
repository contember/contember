import {
	GraphQLBoolean,
	GraphQLFieldConfig,
	GraphQLInputObjectType,
	GraphQLNamedType,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLSchemaConfig,
	GraphQLString,
} from 'graphql'
import { Model } from '@contember/schema'
import { MutationProvider } from './MutationProvider'
import { QueryProvider } from './QueryProvider'
import { ValidationQueriesProvider } from './ValidationQueriesProvider'
import { Context } from '../types'
import { ResultSchemaTypeProvider } from './ResultSchemaTypeProvider'

type BuildArgs = {
	queries?: Map<string, GraphQLFieldConfig<any, Context, any>>
	mutations?: Map<string, GraphQLFieldConfig<any, Context, any>>
	types?: GraphQLNamedType[]
}

export class GraphQlSchemaBuilder {
	constructor(
		private readonly schema: Model.Schema,
		private readonly queryProvider: QueryProvider,
		private readonly validationQueriesProvider: ValidationQueriesProvider,
		private readonly mutationProvider: MutationProvider,
		private readonly resultSchemaTypeProvider: ResultSchemaTypeProvider,
	) {}

	public build(args: BuildArgs = {}): GraphQLSchema {
		return new GraphQLSchema(this.buildConfig(args))
	}

	private buildConfig(args: BuildArgs): GraphQLSchemaConfig {
		const queries = new Map<string, GraphQLFieldConfig<any, Context, any>>(args.queries)
		const mutations = new Map<string, GraphQLFieldConfig<any, Context, any>>(args.mutations)
		for (const entity of Object.values(this.schema.entities)) {
			const queryFields = this.queryProvider.getQueries(entity)
			for (const name in queryFields) {
				queries.set(name, queryFields[name])
			}
			const validationFields = this.validationQueriesProvider.getQueries(entity)
			for (const name in validationFields) {
				queries.set(name, validationFields[name])
			}
			const mutationFields = this.mutationProvider.getMutations(entity)
			for (const name in mutationFields) {
				mutations.set(name, mutationFields[name])
			}
		}

		if (queries.size > 0) {
			const queryTransactionType = new GraphQLObjectType({
				name: 'QueryTransaction',
				fields: Object.fromEntries(queries),
			})
			queries.set('transaction', {
				type: queryTransactionType,
				resolve: async (parent, args, context: Context, info) => {
					return context.timer(`GraphQL.query.${info.fieldName}`, () =>
						context.executionContainer.readResolver.resolveTransaction(info),
					)
				},
			})
		}
		const queryObjectType = new GraphQLObjectType({
			name: 'Query',
			fields: () => Object.fromEntries(queries),
		})
		if (mutations.size > 0) {
			const mutationTransactionOptions = new GraphQLInputObjectType({
				name: 'MutationTransactionOptions',
				fields: {
					deferForeignKeyConstraints: { type: GraphQLBoolean },
					deferUniqueConstraints: { type: GraphQLBoolean },
				},
			})
			const mutationTransactionType = new GraphQLObjectType({
				name: 'MutationTransaction',
				fields: {
					ok: { type: new GraphQLNonNull(GraphQLBoolean) },
					errorMessage: { type: GraphQLString },
					errors: { type: this.resultSchemaTypeProvider.errorListResultType },
					validation: {
						type: new GraphQLNonNull(this.resultSchemaTypeProvider.validationResultType),
					},
					...Object.fromEntries(mutations),
					query: {
						type: queryObjectType,
					},
				},
			})
			mutations.set('transaction', {
				args: {
					options: {
						type: mutationTransactionOptions,
					},
				},
				type: new GraphQLNonNull(
					mutationTransactionType,
				),
				resolve: async (parent, args: { options?: { deferForeignKeyConstraints?: boolean; deferUniqueConstraints?: boolean } }, context: Context, info) => {
					return context.timer(`GraphQL.mutation.${info.fieldName}`, () =>
						context.executionContainer.mutationResolver.resolveTransaction(info, {
							deferForeignKeyConstraints: args.options?.deferForeignKeyConstraints ?? false,
							deferUniqueConstraints: args.options?.deferUniqueConstraints ?? false,
						}),
					)
				},
			})
			mutations.set('query', {
				type: new GraphQLNonNull(queryObjectType),
				resolve: (parent, args, context: Context, info) => context.executionContainer.readResolver.resolveQuery(info),
			})
		}
		const infoType = new GraphQLObjectType({
			name: 'Info',
			fields: () => ({
				description: { type: GraphQLString },
			}),
		})
		queries.set('_info', {
			type: infoType,
			resolve: () => ({
				description: 'TODO',
			}),
		})


		return {
			query: queryObjectType,
			types: args.types,
			...(mutations.size > 0
				? {
					mutation: new GraphQLObjectType({
						name: 'Mutation',
						fields: () => Object.fromEntries(mutations),
					}),
				}
				: {}),
		}
	}
}
