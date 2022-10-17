import { GraphQLFieldConfig, GraphQLInt, GraphQLList, GraphQLNonNull } from 'graphql'
import { Acl, Input, Model } from '@contember/schema'
import { Context } from '../types'
import { EntityTypeProvider } from './EntityTypeProvider'
import { WhereTypeProvider } from './WhereTypeProvider'
import { Authorizator } from '../acl'
import { OrderByTypeProvider } from './OrderByTypeProvider'
import { ExtensionKey, Operation, OperationMeta } from './OperationExtension'
import { ImplementationException } from '../exception'
import { PaginatedFieldConfigFactory } from './PaginatedFieldConfigFactory'

export class QueryProvider {
	constructor(
		private readonly authorizator: Authorizator,
		private readonly whereTypeProvider: WhereTypeProvider,
		private readonly orderByTypeProvider: OrderByTypeProvider,
		private readonly entityTypeProvider: EntityTypeProvider,
		private readonly paginatedFieldConfigFactory: PaginatedFieldConfigFactory,
	) {}

	public getQueries(entity: Model.Entity): { [fieldName: string]: GraphQLFieldConfig<any, Context, any> } {
		if (this.authorizator.getEntityPermission(Acl.Operation.read, entity.name) === 'no') {
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
					type: new GraphQLNonNull(uniqueWhere),
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
					return context.executionContainer.readResolver.resolveGetQuery(entity, info)
				})
			},
		}
	}

	private getListQuery(entity: Model.Entity): GraphQLFieldConfig<any, Context, Input.ListQueryInput> {
		const entityName = entity.name

		const entityType = this.entityTypeProvider.getEntity(entityName)
		return {
			type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(entityType))),
			args: {
				filter: {
					type: this.whereTypeProvider.getEntityWhereType(entityName),
				},
				orderBy: {
					type: new GraphQLList(new GraphQLNonNull(this.orderByTypeProvider.getEntityOrderByType(entityName))),
				},
				offset: {
					type: GraphQLInt,
				},
				limit: {
					type: GraphQLInt,
				},
			},
			extensions: { [ExtensionKey]: new OperationMeta(Operation.list, entity) },
			resolve: (parent, args, context, info) => {
				return context.timer(`GraphQL.query.${info.fieldName}`, () => {
					if (parent && info.path) {
						return parent[info.path.key]
					}
					return context.executionContainer.readResolver.resolveListQuery(entity, info)
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
					return context.executionContainer.readResolver.resolvePaginationQuery(entity, info)
				})
			},
		}
	}
}
