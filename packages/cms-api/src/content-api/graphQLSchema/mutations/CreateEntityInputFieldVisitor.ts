import { GraphQLInputFieldConfig, GraphQLList, GraphQLNonNull } from 'graphql'
import { Acl, Model } from 'cms-common'
import ColumnTypeResolver from '../ColumnTypeResolver'
import CreateEntityRelationInputProvider from './CreateEntityRelationInputProvider'
import Authorizator from "../../../acl/Authorizator";

export default class CreateEntityInputFieldVisitor
	implements
		Model.ColumnVisitor<GraphQLInputFieldConfig | undefined>,
		Model.RelationByGenericTypeVisitor<GraphQLInputFieldConfig | undefined> {
	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly createEntityRelationInputProvider: CreateEntityRelationInputProvider
	) {}

	public visitColumn(entity: Model.Entity, column: Model.AnyColumn): GraphQLInputFieldConfig | undefined {
		if (entity.primary === column.name) {
			return undefined
		}
		if (!this.authorizator.isAllowed(Acl.Operation.create, entity.name, column.name)) {
			return undefined
		}
		const type = this.columnTypeResolver.getType(column)
		return {
			type: column.nullable ? type : new GraphQLNonNull(type)
		}
	}

	public visitHasOne(entity: Model.Entity, relation: Model.Relation & Model.NullableRelation): GraphQLInputFieldConfig | undefined {
		const type = this.createEntityRelationInputProvider.getCreateEntityRelationInput(entity.name, relation.name)
		if (type === undefined) {
			return undefined
		}
		return {
			type: relation.nullable ? type : new GraphQLNonNull(type)
		}
	}

	public visitHasMany(entity: Model.Entity, relation: Model.Relation): GraphQLInputFieldConfig | undefined {
		const type = this.createEntityRelationInputProvider.getCreateEntityRelationInput(entity.name, relation.name)
		if (type === undefined) {
			return undefined
		}
		return {
			type: new GraphQLList(new GraphQLNonNull(type))
		}
	}
}
