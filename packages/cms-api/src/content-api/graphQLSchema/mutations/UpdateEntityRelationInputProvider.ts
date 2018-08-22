import singletonFactory from '../../../utils/singletonFactory'
import { GraphQLInputObjectType } from 'graphql'
import { acceptFieldVisitor } from '../../../content-schema/modelUtils'
import UpdateEntityRelationInputFieldVisitor from './UpdateEntityRelationInputFieldVisitor'
import { Model } from 'cms-common'

export default class UpdateEntityRelationInputProvider {
	private updateEntityRelationInputs = singletonFactory<
		GraphQLInputObjectType,
		{
			entityName: string
			relationName: string
		}
	>(id => this.createUpdateEntityRelationInput(id.entityName, id.relationName))

	constructor(
		private readonly schema: Model.Schema,
		private readonly updateEntityRelationInputFieldVisitor: UpdateEntityRelationInputFieldVisitor
	) {}

	public getUpdateEntityRelationInput(entityName: string, relationName: string) {
		return this.updateEntityRelationInputs({ entityName, relationName })
	}

	private createUpdateEntityRelationInput(entityName: string, relationName: string): GraphQLInputObjectType {
		return acceptFieldVisitor(this.schema, entityName, relationName, this.updateEntityRelationInputFieldVisitor)
	}
}
