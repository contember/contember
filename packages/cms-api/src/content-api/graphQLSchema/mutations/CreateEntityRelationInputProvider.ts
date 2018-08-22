import { acceptFieldVisitor } from '../../../content-schema/modelUtils'
import CreateEntityRelationInputFieldVisitor from './CreateEntityRelationInputFieldVisitor'
import { GraphQLInputObjectType } from 'graphql'
import singletonFactory from '../../../utils/singletonFactory'
import { Model } from 'cms-common'

export default class CreateEntityRelationInputProvider {
	private createEntityRelationInputs = singletonFactory<
		GraphQLInputObjectType,
		{ entityName: string; relationName: string }
	>(id => this.createCreateEntityRelationInput(id.entityName, id.relationName))

	constructor(
		private readonly schema: Model.Schema,
		private readonly createEntityRelationInputFieldVisitor: CreateEntityRelationInputFieldVisitor
	) {}

	public getCreateEntityRelationInput(entityName: string, relationName: string) {
		return this.createEntityRelationInputs({ entityName, relationName })
	}

	private createCreateEntityRelationInput(entityName: string, relationName: string): GraphQLInputObjectType {
		return acceptFieldVisitor(this.schema, entityName, relationName, this.createEntityRelationInputFieldVisitor)
	}
}
