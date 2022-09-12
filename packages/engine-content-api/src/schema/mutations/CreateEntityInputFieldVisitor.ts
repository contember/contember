import { GraphQLInputFieldConfig, GraphQLList, GraphQLNonNull } from 'graphql'
import { Acl, Model } from '@contember/schema'
import { ColumnTypeResolver } from '../ColumnTypeResolver'
import { CreateEntityRelationInputProvider } from './CreateEntityRelationInputProvider'
import { Authorizator } from '../../acl'

export class CreateEntityInputFieldVisitor implements
	Model.ColumnVisitor<GraphQLInputFieldConfig | undefined>,
	Model.RelationByGenericTypeVisitor<GraphQLInputFieldConfig | undefined> {

	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly createEntityRelationInputProvider: CreateEntityRelationInputProvider,
	) {}

	public visitColumn({ entity, column }: Model.ColumnContext): GraphQLInputFieldConfig | undefined {
		if (entity.primary === column.name && !this.authorizator.isCustomPrimaryAllowed(entity.name)) {
			return undefined
		}
		if (this.authorizator.getFieldPermissions(Acl.Operation.create, entity.name, column.name) === 'no') {
			return undefined
		}
		const type = this.columnTypeResolver.getType(column)
		return {
			type,
		}
	}

	public visitHasOne({ entity, relation }: Model.AnyHasOneRelationContext): GraphQLInputFieldConfig | undefined {
		const type = this.createEntityRelationInputProvider.getCreateEntityRelationInput(entity.name, relation.name)
		if (type === undefined) {
			return undefined
		}
		return {
			type,
		}
	}

	public visitHasMany({ entity, relation }: Model.AnyHasManyRelationContext): GraphQLInputFieldConfig | undefined {
		const type = this.createEntityRelationInputProvider.getCreateEntityRelationInput(entity.name, relation.name)
		if (type === undefined) {
			return undefined
		}
		return {
			type: new GraphQLList(new GraphQLNonNull(type)),
		}
	}
}
