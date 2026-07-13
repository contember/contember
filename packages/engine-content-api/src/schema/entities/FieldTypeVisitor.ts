import { GraphQLList, GraphQLNonNull, GraphQLOutputType } from 'graphql'
import { Acl, Model } from '@contember/schema'
import { ColumnTypeResolver } from '../ColumnTypeResolver.js'
import { EntityTypeProvider } from '../EntityTypeProvider.js'
import { Authorizator } from '../../acl/index.js'

export class FieldTypeVisitor implements Model.ColumnVisitor<GraphQLOutputType>, Model.RelationByGenericTypeVisitor<GraphQLOutputType> {
	constructor(
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly entityTypeProvider: EntityTypeProvider,
		private readonly authorizator: Authorizator,
	) {
	}

	public visitColumn({ column, entity }: Model.ColumnContext): GraphQLOutputType {
		const [type] = this.columnTypeResolver.getType(column)
		if (!column.nullable && this.authorizator.isFieldNonNullSafe(Acl.Operation.read, entity.name, column.name, entity.primary)) {
			return new GraphQLNonNull(type)
		}
		return type
	}

	public visitHasMany({ relation }: Model.AnyHasManyRelationContext): GraphQLOutputType {
		const entityType = this.entityTypeProvider.getEntity(relation.target)
		return new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(entityType)))
	}

	public visitHasOne({ relation }: Model.AnyHasOneRelationContext): GraphQLOutputType {
		return this.entityTypeProvider.getEntity(relation.target)
	}
}
