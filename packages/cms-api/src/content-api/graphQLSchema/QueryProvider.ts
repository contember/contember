import { GraphQLFieldConfig, GraphQLList, GraphQLNonNull } from 'graphql'
import { Input, Model } from 'cms-common'
import { getEntity } from '../../content-schema/modelUtils'
import { Context } from '../types'
import EntityTypeProvider from './EntityTypeProvider'
import WhereTypeProvider from './WhereTypeProvider'
import ReadResolver from '../graphQlResolver/ReadResolver'

export default class QueryProvider {
	constructor(
		private readonly schema: Model.Schema,
		private readonly whereTypeProvider: WhereTypeProvider,
		private readonly entityTypeProvider: EntityTypeProvider,
		private readonly readResolver: ReadResolver
	) {}

	public getQueries(entityName: string): { [fieldName: string]: GraphQLFieldConfig<any, Context, any> } {
		const entity = getEntity(this.schema, entityName)
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
			resolve: async (parent, args, context, info) => {
				return await this.readResolver.resolveGetQuery(entity, parent, args, context, info)
			}
		}
	}

	private getListQuery(entityName: string): GraphQLFieldConfig<any, Context, Input.ListQueryInput> {
		const entity = getEntity(this.schema, entityName)

		return {
			type: new GraphQLList(this.entityTypeProvider.getEntity(entityName)),
			args: {
				where: { type: this.whereTypeProvider.getEntityWhereType(entityName) }
			},
			resolve: async (parent, args, context, info) => {
				return await this.readResolver.resolveListQuery(entity, parent, args, context, info)
			}
		}
	}
}
