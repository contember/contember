import { GraphQLList, GraphQLNonNull, GraphQLOutputType } from 'graphql'
import { Acl, Model } from '@contember/schema'
import { ColumnTypeResolver } from '../ColumnTypeResolver'
import { EntityTypeProvider } from '../EntityTypeProvider'
import { Authorizator } from '../../acl'
import { ImplementationException } from '../../exception'

export class FieldTypeVisitor implements Model.ColumnVisitor<GraphQLOutputType>, Model.RelationByGenericTypeVisitor<GraphQLOutputType> {
	constructor(
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly entityTypeProvider: EntityTypeProvider,
		private readonly authorizator: Authorizator,
	) {
	}

	public visitColumn({ column, entity }: Model.ColumnContext): GraphQLOutputType {
		const basicType = this.columnTypeResolver.getType(column)
		const fieldPredicate = this.authorizator.getFieldPredicate(Acl.Operation.read, entity.name, column.name)
		const idPredicate = this.authorizator.getFieldPredicate(Acl.Operation.read, entity.name, entity.primary)
		if (!fieldPredicate || !idPredicate) {
			throw new ImplementationException()
		}
		if (!column.nullable && (fieldPredicate === true || fieldPredicate === idPredicate)) {
			return new GraphQLNonNull(basicType)
		}
		return basicType
	}

	public visitHasMany({ relation }: Model.AnyHasManyRelationContext): GraphQLOutputType {
		const entityType = this.entityTypeProvider.getEntity(relation.target)
		return new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(entityType)))
	}

	public visitHasOne({ relation }: Model.AnyHasOneRelationContext): GraphQLOutputType {
		return this.entityTypeProvider.getEntity(relation.target)
	}
}
