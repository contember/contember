import { GraphQLFieldConfig, GraphQLSchema } from 'graphql'
import { Model } from '@contember/schema'
import { MutationProvider } from './MutationProvider'
import { QueryProvider } from './QueryProvider'
import { ValidationQueriesProvider } from './ValidationQueriesProvider'
import { GraphQLObjectsFactory } from '@contember/graphql-utils'
import { Context } from '../types'
import { ResultSchemaTypeProvider } from './ResultSchemaTypeProvider'

export class GraphQlSchemaBuilder {
	constructor(
		private readonly schema: Model.Schema,
		private readonly queryProvider: QueryProvider,
		private readonly validationQueriesProvider: ValidationQueriesProvider,
		private readonly mutationProvider: MutationProvider,
		private readonly graphqlObjectFactories: GraphQLObjectsFactory,
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
				type: this.graphqlObjectFactories.createObjectType({
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
		if (mutations.size > 0) {
			mutations.set('transaction', {
				type: this.graphqlObjectFactories.createNotNull(
					this.graphqlObjectFactories.createObjectType({
						name: 'MutationTransaction',
						fields: {
							ok: { type: this.graphqlObjectFactories.createNotNull(this.graphqlObjectFactories.boolean) },
							errorMessage: { type: this.graphqlObjectFactories.string },
							errors: { type: this.resultSchemaTypeProvider.errorListResultType },
							validation: {
								type: this.graphqlObjectFactories.createNotNull(this.resultSchemaTypeProvider.validationResultType),
							},
							...Object.fromEntries(mutations),
						},
					}),
				),
				resolve: async (parent, args, context: Context, info) => {
					return context.timer(`GraphQL.mutation.${info.fieldName}`, () =>
						context.executionContainer.mutationResolver.resolveTransaction(info),
					)
				},
			})
		}
		queries.set('_info', {
			type: this.graphqlObjectFactories.createObjectType({
				name: 'Info',
				fields: () => ({
					description: { type: this.graphqlObjectFactories.string },
				}),
			}),
			resolve: () => ({
				description: 'TODO',
			}),
		})

		return this.graphqlObjectFactories.createSchema({
			query: this.graphqlObjectFactories.createObjectType({
				name: 'Query',
				fields: () => Object.fromEntries(queries),
			}),
			...(mutations.size > 0
				? {
						mutation: this.graphqlObjectFactories.createObjectType({
							name: 'Mutation',
							fields: () => Object.fromEntries(mutations),
						}),
				  }
				: {}),
		})
	}
}
