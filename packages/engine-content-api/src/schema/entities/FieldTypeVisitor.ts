import { GraphQLList, GraphQLNonNull, GraphQLOutputType } from 'graphql'
import { Acl, Model } from '@contember/schema'
import { ColumnTypeResolver } from '../ColumnTypeResolver.js'
import { EntityTypeProvider } from '../EntityTypeProvider.js'
import { Authorizator } from '../../acl/index.js'
import { ImplementationException } from '../../exception.js'

export class FieldTypeVisitor implements Model.ColumnVisitor<GraphQLOutputType>, Model.RelationByGenericTypeVisitor<GraphQLOutputType> {
	constructor(
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly entityTypeProvider: EntityTypeProvider,
		private readonly authorizator: Authorizator,
		private readonly rootAuthorizator: Authorizator,
	) {
	}

	public visitColumn({ column, entity }: Model.ColumnContext): GraphQLOutputType {
		const [type] = this.columnTypeResolver.getType(column)
		const fieldPredicate = this.authorizator.getFieldPredicate(Acl.Operation.read, entity.name, column.name)
		const idPredicate = this.authorizator.getFieldPredicate(Acl.Operation.read, entity.name, entity.primary)
		if (!fieldPredicate || !idPredicate) {
			throw new ImplementationException()
		}
		// one type serves both scopes, so it must take the weaker of the two - a column granted only via `through` is not filled at the root
		const alwaysReadable = this.isAlwaysReadable(this.authorizator, entity, column) && this.isAlwaysReadable(this.rootAuthorizator, entity, column)
		if (!column.nullable && alwaysReadable) {
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

	/** Whether a row this scope returns always carries the column, so it may be non-null as far as this scope is concerned. */
	private isAlwaysReadable(authorizator: Authorizator, entity: Model.Entity, column: Model.AnyColumn): boolean {
		if (authorizator.getEntityPermission(Acl.Operation.read, entity.name) === 'no') {
			// the scope never returns a row of this entity, so it constrains nothing
			return true
		}
		const fieldPredicate = authorizator.getFieldPredicate(Acl.Operation.read, entity.name, column.name)
		if (!fieldPredicate) {
			return false
		}
		return fieldPredicate === true || fieldPredicate === authorizator.getFieldPredicate(Acl.Operation.read, entity.name, entity.primary)
	}
}
