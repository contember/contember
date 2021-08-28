import {
	GraphQLFieldConfig,
	GraphQLBoolean,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
} from 'graphql'
import { Model } from '@contember/schema'
import { MutationProvider } from './MutationProvider'
import { QueryProvider } from './QueryProvider'
import { ValidationQueriesProvider } from './ValidationQueriesProvider'
import { Context } from '../types'
import { ResultSchemaTypeProvider } from './ResultSchemaTypeProvider'

export class GraphQlSchemaBuilder {
	constructor(
		private readonly schema: Model.Schema,
		private readonly queryProvider: QueryProvider,
		private readonly validationQueriesProvider: ValidationQueriesProvider,
		private readonly mutationProvider: MutationProvider,
		private readonly resultSchemaTypeProvider: ResultSchemaTypeProvider,
	) {}

	public build(): GraphQLSchema {
		const queries = new Map<string, GraphQLFieldConfig<any, Context, any>>()
		const mutations = new Map<string, GraphQLFieldConfig<any, Context, any>>()
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
			queries.set('transaction', {
				type: new GraphQLObjectType({
					name: 'QueryTransaction',
					fields: Object.fromEntries(queries),
				}),
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
			mutations.set('transaction', {
				type: new GraphQLNonNull(
					new GraphQLObjectType({
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
					}),
				),
				resolve: async (parent, args, context: Context, info) => {
					return context.timer(`GraphQL.mutation.${info.fieldName}`, () =>
						context.executionContainer.mutationResolver.resolveTransaction(info),
					)
				},
			})
			mutations.set('query', {
				type: new GraphQLNonNull(queryObjectType),
				resolve: (parent, args, context: Context, info) => context.executionContainer.readResolver.resolveQuery(info),
			})
		}
		queries.set('_info', {
			type: new GraphQLObjectType({
				name: 'Info',
				fields: () => ({
					description: { type: GraphQLString },
				}),
			}),
			resolve: () => ({
				description: 'TODO',
			}),
		})

		return new GraphQLSchema({
			query: queryObjectType,
			...(mutations.size > 0
				? {
					mutation: new GraphQLObjectType({
						name: 'Mutation',
						fields: () => Object.fromEntries(mutations),
					}),
				  }
				: {}),
		})
	}
}
