import { GraphQLInputFieldConfig } from 'graphql'
import { Acl, Model } from '@contember/schema'
import ColumnTypeResolver from '../ColumnTypeResolver'
import CreateEntityRelationInputProvider from './CreateEntityRelationInputProvider'
import Authorizator from '../../acl/Authorizator'
import { GraphQLObjectsFactory } from '@contember/graphql-utils'

export default class CreateEntityInputFieldVisitor
	implements
		Model.ColumnVisitor<GraphQLInputFieldConfig | undefined>,
		Model.RelationByGenericTypeVisitor<GraphQLInputFieldConfig | undefined> {
	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly createEntityRelationInputProvider: CreateEntityRelationInputProvider,
		private readonly graphqlObjectFactories: GraphQLObjectsFactory,
	) {}

	public visitColumn(entity: Model.Entity, column: Model.AnyColumn): GraphQLInputFieldConfig | undefined {
		if (entity.primary === column.name && !this.authorizator.isCustomPrimaryAllowed(entity.name)) {
			return undefined
		}
		if (!this.authorizator.isAllowed(Acl.Operation.create, entity.name, column.name)) {
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
		const type = this.createEntityRelationInputProvider.getCreateEntityRelationInput(entity.name, relation.name)
		if (type === undefined) {
			return undefined
		}
		return {
			type,
		}
	}

	public visitHasMany(entity: Model.Entity, relation: Model.Relation): GraphQLInputFieldConfig | undefined {
		const type = this.createEntityRelationInputProvider.getCreateEntityRelationInput(entity.name, relation.name)
		if (type === undefined) {
			return undefined
		}
		return {
			type: this.graphqlObjectFactories.createList(this.graphqlObjectFactories.createNotNull(type)),
		}
	}
}
