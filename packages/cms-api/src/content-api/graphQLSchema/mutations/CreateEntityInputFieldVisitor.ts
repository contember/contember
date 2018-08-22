import { GraphQLInputFieldConfig, GraphQLList, GraphQLNonNull } from 'graphql'
import { Model } from 'cms-common'
import ColumnTypeResolver from '../ColumnTypeResolver'
import CreateEntityRelationInputProvider from './CreateEntityRelationInputProvider'

export default class CreateEntityInputFieldVisitor
	implements
		Model.ColumnVisitor<GraphQLInputFieldConfig | undefined>,
		Model.RelationByGenericTypeVisitor<GraphQLInputFieldConfig> {
	constructor(
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly createEntityRelationInputProvider: CreateEntityRelationInputProvider
	) {}

	public visitColumn(entity: Model.Entity, column: Model.AnyColumn): GraphQLInputFieldConfig | undefined {
		if (entity.primary === column.name) {
			return undefined
		}
		const type = this.columnTypeResolver.getType(column)
		return {
			type: column.nullable ? type : new GraphQLNonNull(type)
		}
	}

	public visitHasOne(entity: Model.Entity, relation: Model.Relation & Model.NullableRelation): GraphQLInputFieldConfig {
		const type = this.createEntityRelationInputProvider.getCreateEntityRelationInput(entity.name, relation.name)
		return {
			type: relation.nullable ? type : new GraphQLNonNull(type)
		}
	}

	public visitHasMany(entity: Model.Entity, relation: Model.Relation): GraphQLInputFieldConfig {
		const type = this.createEntityRelationInputProvider.getCreateEntityRelationInput(entity.name, relation.name)
		return {
			type: new GraphQLList(new GraphQLNonNull(type))
		}
	}
}
