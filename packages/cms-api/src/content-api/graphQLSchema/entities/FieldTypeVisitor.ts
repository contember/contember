import { GraphQLList } from 'graphql'
import { GraphQLNonNull, GraphQLOutputType } from 'graphql'
import { Model } from 'cms-common'
import ColumnTypeResolver from '../ColumnTypeResolver'
import EntityTypeProvider from '../EntityTypeProvider'

export default class FieldTypeVisitor
	implements Model.ColumnVisitor<GraphQLOutputType>, Model.RelationByGenericTypeVisitor<GraphQLOutputType> {
	private columnTypeResolver: ColumnTypeResolver
	private entityTypeProvider: EntityTypeProvider

	constructor(columnTypeResolver: ColumnTypeResolver, entityTypeProvider: EntityTypeProvider) {
		this.columnTypeResolver = columnTypeResolver
		this.entityTypeProvider = entityTypeProvider
	}

	public visitColumn(entity: Model.Entity, column: Model.AnyColumn): GraphQLOutputType {
		const basicType = this.columnTypeResolver.getType(column)
		return column.nullable ? basicType : new GraphQLNonNull(basicType)
	}

	public visitHasMany(entity: Model.Entity, relation: Model.Relation): GraphQLOutputType {
		return new GraphQLList(new GraphQLNonNull(this.entityTypeProvider.getEntity(relation.target)))
	}

	public visitHasOne(entity: Model.Entity, relation: Model.Relation & Model.NullableRelation): GraphQLOutputType {
		const entityType = this.entityTypeProvider.getEntity(relation.target)
		return relation.nullable ? entityType : new GraphQLNonNull(entityType)
	}
}
