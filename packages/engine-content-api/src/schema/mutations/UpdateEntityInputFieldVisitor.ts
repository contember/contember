import { GraphQLInputFieldConfig, GraphQLList, GraphQLNonNull } from 'graphql'
import { Acl, Model } from '@contember/schema'
import { ColumnTypeResolver } from '../ColumnTypeResolver'
import { UpdateEntityRelationInputProvider } from './UpdateEntityRelationInputProvider'
import { Authorizator } from '../../acl'

export class UpdateEntityInputFieldVisitor
	implements
		Model.ColumnVisitor<GraphQLInputFieldConfig | undefined>,
		Model.RelationByGenericTypeVisitor<GraphQLInputFieldConfig | undefined>
{
	constructor(
		private readonly authorizator: Authorizator,
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly updateEntityRelationInputProvider: UpdateEntityRelationInputProvider,
	) {}

	public visitColumn(entity: Model.Entity, column: Model.AnyColumn): GraphQLInputFieldConfig | undefined {
		if (entity.primary === column.name) {
			return undefined
		}
		if (!this.authorizator.isAllowed(Acl.Operation.update, entity.name, column.name)) {
			return undefined
		}
		const type = this.columnTypeResolver.getType(column)
		return {
			type,
		}
	}

	public visitHasOne(
		entity: Model.Entity,
		relation: Model.Relation & Model.NullableRelation,
	): GraphQLInputFieldConfig | undefined {
		const type = this.updateEntityRelationInputProvider.getUpdateEntityRelationInput(entity.name, relation.name)
		if (type === undefined) {
			return undefined
		}
		return {
			type,
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
