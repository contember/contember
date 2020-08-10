import { GraphQLOutputType } from 'graphql'
import { Model } from '@contember/schema'
import ColumnTypeResolver from '../ColumnTypeResolver'
import EntityTypeProvider from '../EntityTypeProvider'
import { GraphQLObjectsFactory } from '../GraphQLObjectsFactory'

export default class FieldTypeVisitor
	implements Model.ColumnVisitor<GraphQLOutputType>, Model.RelationByGenericTypeVisitor<GraphQLOutputType> {
	private columnTypeResolver: ColumnTypeResolver
	private entityTypeProvider: EntityTypeProvider

	constructor(
		columnTypeResolver: ColumnTypeResolver,
		entityTypeProvider: EntityTypeProvider,
		private readonly graphqlObjectFactories: GraphQLObjectsFactory,
	) {
		this.columnTypeResolver = columnTypeResolver
		this.entityTypeProvider = entityTypeProvider
	}

	public visitColumn(entity: Model.Entity, column: Model.AnyColumn): GraphQLOutputType {
		const basicType = this.columnTypeResolver.getType(column)
		return column.nullable ? basicType : this.graphqlObjectFactories.createNotNull(basicType)
	}

	public visitHasMany(entity: Model.Entity, relation: Model.Relation): GraphQLOutputType {
		return this.graphqlObjectFactories.createNotNull(
			this.graphqlObjectFactories.createList(
				this.graphqlObjectFactories.createNotNull(this.entityTypeProvider.getEntity(relation.target)),
			),
		)
	}

	public visitHasOne(entity: Model.Entity, relation: Model.Relation & Model.NullableRelation): GraphQLOutputType {
		return this.entityTypeProvider.getEntity(relation.target)
	}
}
