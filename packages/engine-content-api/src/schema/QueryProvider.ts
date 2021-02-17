import { GraphQLFieldConfig } from 'graphql'
import { Acl, Input, Model } from '@contember/schema'
import { Context } from '../types'
import { EntityTypeProvider } from './EntityTypeProvider'
import { WhereTypeProvider } from './WhereTypeProvider'
import { Authorizator } from '../acl'
import { OrderByTypeProvider } from './OrderByTypeProvider'
import { GraphQLObjectsFactory } from '@contember/graphql-utils'
import { ExtensionKey, Operation, OperationMeta } from './OperationExtension'
import { ImplementationException } from '../exception'
import { PaginatedFieldConfigFactory } from './PaginatedFieldConfigFactory'

export class QueryProvider {
	constructor(
		private readonly authorizator: Authorizator,
		private readonly whereTypeProvider: WhereTypeProvider,
		private readonly orderByTypeProvider: OrderByTypeProvider,
		private readonly entityTypeProvider: EntityTypeProvider,
		private readonly graphqlObjectFactories: GraphQLObjectsFactory,
		private readonly paginatedFieldConfigFactory: PaginatedFieldConfigFactory,
	) {}

	public getQueries(entity: Model.Entity): { [fieldName: string]: GraphQLFieldConfig<any, Context, any> } {
		if (!this.authorizator.isAllowed(Acl.Operation.read, entity.name)) {
			return {}
		}
		return {
			['get' + entity.name]: this.getByUniqueQuery(entity),
			['list' + entity.name]: this.getListQuery(entity),
			['paginate' + entity.name]: this.getPaginationQuery(entity),
		}
	}

	private getByUniqueQuery(entity: Model.Entity): GraphQLFieldConfig<any, Context, Input.UniqueQueryInput> {
		const entityName = entity.name
		const entityType = this.entityTypeProvider.getEntity(entityName)
		const uniqueWhere = this.whereTypeProvider.getEntityUniqueWhereType(entityName)
		if (!uniqueWhere) {
			throw new ImplementationException()
		}
		return {
			type: entityType,
			args: {
				by: {
					type: this.graphqlObjectFactories.createNotNull(uniqueWhere),
				},
				filter: {
					type: this.whereTypeProvider.getEntityWhereType(entityName),
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

	private getListQuery(entity: Model.Entity): GraphQLFieldConfig<any, Context, Input.ListQueryInput> {
		const entityName = entity.name

		const entityType = this.entityTypeProvider.getEntity(entityName)
		return {
			type: this.graphqlObjectFactories.createNotNull(
				this.graphqlObjectFactories.createList(this.graphqlObjectFactories.createNotNull(entityType)),
			),
			args: {
				filter: {
					type: this.whereTypeProvider.getEntityWhereType(entityName),
				},
				orderBy: {
					type: this.graphqlObjectFactories.createList(
						this.graphqlObjectFactories.createNotNull(this.orderByTypeProvider.getEntityOrderByType(entityName)),
					),
				},
				offset: {
					type: this.graphqlObjectFactories.int,
				},
				limit: {
					type: this.graphqlObjectFactories.int,
				},
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

	private getPaginationQuery(entity: Model.Entity): GraphQLFieldConfig<any, Context, Input.ListQueryInput> {
		return {
			...this.paginatedFieldConfigFactory.createFieldConfig(entity),
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
