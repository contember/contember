import { GraphQLInputFieldConfig, GraphQLList, GraphQLNonNull } from 'graphql'
import { Acl, Model } from '@contember/schema'
import { ColumnTypeResolver } from '../ColumnTypeResolver'
import { UpdateEntityRelationInputProvider } from './UpdateEntityRelationInputProvider'
import { Authorizator } from '../../acl'

export class UpdateEntityInputFieldVisitor implements
	Model.ColumnVisitor<GraphQLInputFieldConfig | undefined>,
	Model.RelationByGenericTypeVisitor<GraphQLInputFieldConfig | undefined> {

	constructor(
		private readonly authorizator: Authorizator,
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly updateEntityRelationInputProvider: UpdateEntityRelationInputProvider,
	) {}

	public visitColumn({ entity, column }: Model.ColumnContext) {
		if (entity.primary === column.name) {
			return undefined
		}
		if (this.authorizator.getFieldPermissions(Acl.Operation.update, entity.name, column.name) === 'no') {
			return undefined
		}
		const type = this.columnTypeResolver.getType(column)
		return {
			type,
		}
	}

	public visitHasOne({ entity, relation }: Model.AnyHasOneRelationContext) {
		const type = this.updateEntityRelationInputProvider.getUpdateEntityRelationInput(entity.name, relation.name)
		if (type === undefined) {
			return undefined
		}
		return {
			type,
		}
	}

	public visitHasMany({ entity, relation }: Model.AnyHasManyRelationContext) {
		const type = this.updateEntityRelationInputProvider.getUpdateEntityRelationInput(entity.name, relation.name)
		if (type === undefined) {
			return undefined
		}
		return {
			type: new GraphQLList(new GraphQLNonNull(type)),
		}
	}
}
