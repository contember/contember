import { GraphQLFieldConfig, GraphQLInt, GraphQLList, GraphQLNonNull } from 'graphql'
import { Acl, Input, Model } from '@contember/schema'
import { getEntity } from '@contember/schema-utils'
import { Context } from '../types'
import EntityTypeProvider from './EntityTypeProvider'
import WhereTypeProvider from './WhereTypeProvider'
import Authorizator from '../../acl/Authorizator'
import GraphQlQueryAstFactory from '../graphQlResolver/GraphQlQueryAstFactory'
import OrderByTypeProvider from './OrderByTypeProvider'

export default class QueryProvider {
	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly whereTypeProvider: WhereTypeProvider,
		private readonly orderByTypeProvider: OrderByTypeProvider,
		private readonly entityTypeProvider: EntityTypeProvider,
		private readonly queryAstAFactory: GraphQlQueryAstFactory,
	) {}

	public getQueries(entityName: string): { [fieldName: string]: GraphQLFieldConfig<any, Context, any> } {
		if (!this.authorizator.isAllowed(Acl.Operation.read, entityName)) {
			return {}
		}
		return {
			['get' + entityName]: this.getByUniqueQuery(entityName),
			['list' + entityName]: this.getListQuery(entityName),
		}
	}

	private getByUniqueQuery(entityName: string): GraphQLFieldConfig<any, Context, Input.UniqueQueryInput> {
		const entity = getEntity(this.schema, entityName)
		return {
			type: this.entityTypeProvider.getEntity(entityName),
			args: {
				by: { type: new GraphQLNonNull(this.whereTypeProvider.getEntityUniqueWhereType(entityName)) },
			},
			resolve: (parent, args, context, info) =>
				context.executionContainer.get('readResolver').resolveGetQuery(entity, this.queryAstAFactory.create(info)),
		}
	}

	private getListQuery(entityName: string): GraphQLFieldConfig<any, Context, Input.ListQueryInput> {
		const entity = getEntity(this.schema, entityName)

		return {
			type: new GraphQLList(this.entityTypeProvider.getEntity(entityName)),
			args: {
				filter: { type: this.whereTypeProvider.getEntityWhereType(entityName) },
				orderBy: {
					type: new GraphQLList(new GraphQLNonNull(this.orderByTypeProvider.getEntityOrderByType(entityName))),
				},
				offset: { type: GraphQLInt },
				limit: { type: GraphQLInt },
			},
			resolve: (parent, args, context, info) =>
				context.executionContainer.get('readResolver').resolveListQuery(entity, this.queryAstAFactory.create(info)),
		}
	}
}
