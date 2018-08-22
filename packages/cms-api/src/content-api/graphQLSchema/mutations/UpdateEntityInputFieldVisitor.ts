import { GraphQLInputFieldConfig, GraphQLList, GraphQLNonNull } from 'graphql'
import { Model } from 'cms-common'
import ColumnTypeResolver from '../ColumnTypeResolver'
import UpdateEntityRelationInputProvider from './UpdateEntityRelationInputProvider'

export default class UpdateEntityInputFieldVisitor
	implements
		Model.ColumnVisitor<GraphQLInputFieldConfig | undefined>,
		Model.RelationByGenericTypeVisitor<GraphQLInputFieldConfig | undefined> {
	constructor(
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly updateEntityRelationInputProvider: UpdateEntityRelationInputProvider
	) {}

	public visitColumn(entity: Model.Entity, column: Model.AnyColumn): GraphQLInputFieldConfig | undefined {
		if (entity.primary === column.name) {
			return undefined
		}
		return {
			type: this.columnTypeResolver.getType(column)
		}
	}

	public visitHasOne(entity: Model.Entity, relation: Model.Relation & Model.NullableRelation): GraphQLInputFieldConfig {
		return {
			type: this.updateEntityRelationInputProvider.getUpdateEntityRelationInput(entity.name, relation.name)
		}
	}

	public visitHasMany(entity: Model.Entity, relation: Model.Relation): GraphQLInputFieldConfig {
		const type = this.updateEntityRelationInputProvider.getUpdateEntityRelationInput(entity.name, relation.name)
		return {
			type: new GraphQLList(new GraphQLNonNull(type))
		}
	}
}
