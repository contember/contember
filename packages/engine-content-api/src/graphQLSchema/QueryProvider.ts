import { GraphQLFieldConfig } from 'graphql'
import { Acl, Input, Model } from '@contember/schema'
import { getEntity } from '@contember/schema-utils'
import { Context } from '../types'
import EntityTypeProvider from './EntityTypeProvider'
import WhereTypeProvider from './WhereTypeProvider'
import Authorizator from '../acl/Authorizator'
import OrderByTypeProvider from './OrderByTypeProvider'
import { GraphQLObjectsFactory } from './GraphQLObjectsFactory'
import { ExtensionKey, Operation, OperationMeta } from './OperationExtension'
import { aliasAwareResolver, GqlTypeName } from './utils'

export default class QueryProvider {
	private PageInfo = this.graphqlObjectFactories.createObjectType({
		name: 'PageInfo',
		fields: {
			totalCount: { type: this.graphqlObjectFactories.createNotNull(this.graphqlObjectFactories.int) },
		},
	})

	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly whereTypeProvider: WhereTypeProvider,
		private readonly orderByTypeProvider: OrderByTypeProvider,
		private readonly entityTypeProvider: EntityTypeProvider,
		private readonly graphqlObjectFactories: GraphQLObjectsFactory,
	) {}

	public getQueries(entityName: string): { [fieldName: string]: GraphQLFieldConfig<any, Context, any> } {
		if (!this.authorizator.isAllowed(Acl.Operation.read, entityName)) {
			return {}
		}
		return {
			['get' + entityName]: this.getByUniqueQuery(entityName),
			['list' + entityName]: this.getListQuery(entityName),
			['paginate' + entityName]: this.getPaginationQuery(entityName),
		}
	}

	private getByUniqueQuery(entityName: string): GraphQLFieldConfig<any, Context, Input.UniqueQueryInput> {
		const entity = getEntity(this.schema, entityName)
		return {
			type: this.entityTypeProvider.getEntity(entityName),
			args: {
				by: {
					type: this.graphqlObjectFactories.createNotNull(this.whereTypeProvider.getEntityUniqueWhereType(entityName)),
				},
			},
			extensions: { [ExtensionKey]: new OperationMeta(Operation.get, entity) },
			resolve: (parent, args, context, info) => {
				return context.timer(`GraphQL.query.${info.fieldName}`, () => {
					if (parent && info.path) {
						return parent[info.path.key]
					}
					return context.executionContainer.get('readResolver').resolveGetQuery(entity, info)
				})
			},
		}
	}

	private getListQuery(entityName: string): GraphQLFieldConfig<any, Context, Input.ListQueryInput> {
		const entity = getEntity(this.schema, entityName)

		return {
			type: this.graphqlObjectFactories.createNotNull(
				this.graphqlObjectFactories.createList(
					this.graphqlObjectFactories.createNotNull(this.entityTypeProvider.getEntity(entityName)),
				),
			),
			args: {
				filter: { type: this.whereTypeProvider.getEntityWhereType(entityName) },
				orderBy: {
					type: this.graphqlObjectFactories.createList(
						this.graphqlObjectFactories.createNotNull(this.orderByTypeProvider.getEntityOrderByType(entityName)),
					),
				},
				offset: { type: this.graphqlObjectFactories.int },
				limit: { type: this.graphqlObjectFactories.int },
			},
			extensions: { [ExtensionKey]: new OperationMeta(Operation.list, entity) },
			resolve: (parent, args, context, info) => {
				return context.timer(`GraphQL.query.${info.fieldName}`, () => {
					if (parent && info.path) {
						return parent[info.path.key]
					}
					return context.executionContainer.get('readResolver').resolveListQuery(entity, info)
				})
			},
		}
	}

	private getPaginationQuery(entityName: string): GraphQLFieldConfig<any, Context, Input.ListQueryInput> {
		const entity = getEntity(this.schema, entityName)

		return {
			type: this.graphqlObjectFactories.createNotNull(
				this.graphqlObjectFactories.createObjectType({
					name: GqlTypeName`${entityName}Connection`,
					fields: {
						pageInfo: {
							type: this.graphqlObjectFactories.createNotNull(this.PageInfo),
						},
						edges: {
							type: this.graphqlObjectFactories.createNotNull(
								this.graphqlObjectFactories.createList(
									this.graphqlObjectFactories.createNotNull(
										this.graphqlObjectFactories.createObjectType({
											name: GqlTypeName`${entityName}Edge`,
											fields: {
												node: {
													type: this.graphqlObjectFactories.createNotNull(
														this.entityTypeProvider.getEntity(entityName),
													),
													resolve: aliasAwareResolver,
												},
											},
										}),
									),
								),
							),
							resolve: aliasAwareResolver,
						},
					},
				}),
			),

			args: {
				filter: { type: this.whereTypeProvider.getEntityWhereType(entityName) },
				orderBy: {
					type: this.graphqlObjectFactories.createList(
						this.graphqlObjectFactories.createNotNull(this.orderByTypeProvider.getEntityOrderByType(entityName)),
					),
				},
				skip: { type: this.graphqlObjectFactories.int },
				first: { type: this.graphqlObjectFactories.int },
			},
			extensions: { [ExtensionKey]: new OperationMeta(Operation.paginate, entity) },
			resolve: (parent, args, context, info) => {
				return context.timer(`GraphQL.query.${info.fieldName}`, () => {
					if (parent && info.path) {
						return parent[info.path.key]
					}
					return context.executionContainer.get('readResolver').resolvePaginationQuery(entity, info)
				})
			},
		}
	}
}
