import { singletonFactory } from '../../utils'
import { GraphQLInputObjectType } from 'graphql'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { UpdateEntityRelationInputFieldVisitor } from './UpdateEntityRelationInputFieldVisitor'
import { Model } from '@contember/schema'

export class UpdateEntityRelationInputProvider {
	private updateEntityRelationInputs = singletonFactory<
		GraphQLInputObjectType | undefined,
		{
			entityName: string
			relationName: string
		}
	>(id => this.createUpdateEntityRelationInput(id.entityName, id.relationName))

	constructor(
		private readonly schema: Model.Schema,
		private readonly updateEntityRelationInputFieldVisitor: UpdateEntityRelationInputFieldVisitor,
	) {}

	public getUpdateEntityRelationInput(entityName: string, relationName: string): GraphQLInputObjectType | undefined {
		return this.updateEntityRelationInputs({ entityName, relationName })
	}

	private createUpdateEntityRelationInput(
		entityName: string,
		relationName: string,
	): GraphQLInputObjectType | undefined {
		return acceptFieldVisitor(this.schema, entityName, relationName, this.updateEntityRelationInputFieldVisitor)
	}
}
