import { GraphQLInputFieldConfig, GraphQLList, GraphQLNonNull } from 'graphql'
import { Acl, Model } from 'cms-common'
import ColumnTypeResolver from '../ColumnTypeResolver'
import UpdateEntityRelationInputProvider from './UpdateEntityRelationInputProvider'
import Authorizator from '../../../acl/Authorizator'

export default class UpdateEntityInputFieldVisitor
	implements
		Model.ColumnVisitor<GraphQLInputFieldConfig | undefined>,
		Model.RelationByGenericTypeVisitor<GraphQLInputFieldConfig | undefined> {
	constructor(
		private readonly authorizator: Authorizator,
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly updateEntityRelationInputProvider: UpdateEntityRelationInputProvider
	) {}

	public visitColumn(entity: Model.Entity, column: Model.AnyColumn): GraphQLInputFieldConfig | undefined {
		if (entity.primary === column.name) {
			return undefined
		}
		if (!this.authorizator.isAllowed(Acl.Operation.update, entity.name, column.name)) {
			return undefined
		}
		return {
			type: this.columnTypeResolver.getType(column),
		}
	}

	public visitHasOne(
		entity: Model.Entity,
		relation: Model.Relation & Model.NullableRelation
	): GraphQLInputFieldConfig | undefined {
		const type = this.updateEntityRelationInputProvider.getUpdateEntityRelationInput(entity.name, relation.name)
		if (type === undefined) {
			return undefined
		}
		return {
			type: type,
		}
	}

	public visitHasMany(entity: Model.Entity, relation: Model.Relation): GraphQLInputFieldConfig | undefined {
		const type = this.updateEntityRelationInputProvider.getUpdateEntityRelationInput(entity.name, relation.name)
		if (type === undefined) {
			return undefined
		}
		return {
			type: new GraphQLList(new GraphQLNonNull(type)),
		}
	}
}
