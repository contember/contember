import { GraphQLFieldConfig, GraphQLList, GraphQLNonNull } from 'graphql'
import { Input, Model } from 'cms-common'
import { getEntity } from '../../content-schema/modelUtils'
import { Context } from '../types'
import EntityTypeProvider from './EntityTypeProvider'
import WhereTypeProvider from './WhereTypeProvider'
import Authorizator from '../../acl/Authorizator'
import ReadResolver from '../graphQlResolver/ReadResolver'

export default class QueryProvider {
	constructor(
		private schema: Model.Schema,
		private authorizator: Authorizator,
		private whereTypeProvider: WhereTypeProvider,
		private entityTypeProvider: EntityTypeProvider,
		private readonly readResolver: ReadResolver
	) {}

	public getQueries(entityName: string): { [fieldName: string]: GraphQLFieldConfig<any, Context, any> } {
		const entity = getEntity(this.schema, entityName)
		if (!this.authorizator.isAllowed(Authorizator.Operation.read, entityName)) {
			return {}
		}
		return {
			[entityName]: this.getByUniqueQuery(entityName),
			[entity.pluralName]: this.getListQuery(entityName)
		}
	}

	private getByUniqueQuery(entityName: string): GraphQLFieldConfig<any, Context, Input.UniqueQueryInput> {
		const entity = getEntity(this.schema, entityName)
		return {
			type: this.entityTypeProvider.getEntity(entityName),
			args: {
				where: { type: new GraphQLNonNull(this.whereTypeProvider.getEntityUniqueWhereType(entityName)) }
			},
			resolve: this.readResolver.resolveGetQuery(entity)
		}
	}

	private getListQuery(entityName: string): GraphQLFieldConfig<any, Context, Input.ListQueryInput> {
		const entity = getEntity(this.schema, entityName)

		return {
			type: new GraphQLList(this.entityTypeProvider.getEntity(entityName)),
			args: {
				where: { type: this.whereTypeProvider.getEntityWhereType(entityName) }
			},
			resolve: this.readResolver.resolveListQuery(entity)
		}
	}
}
