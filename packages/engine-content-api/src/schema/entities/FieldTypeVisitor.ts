import { GraphQLList, GraphQLNonNull, GraphQLOutputType } from 'graphql'
import { Model } from '@contember/schema'
import { ColumnTypeResolver } from '../ColumnTypeResolver'
import { EntityTypeProvider } from '../EntityTypeProvider'

export class FieldTypeVisitor
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
		const entityType = this.entityTypeProvider.getEntity(relation.target)
		return new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(entityType)))
	}

	public visitHasOne(entity: Model.Entity, relation: Model.Relation & Model.NullableRelation): GraphQLOutputType {
		return this.entityTypeProvider.getEntity(relation.target)
	}
}
