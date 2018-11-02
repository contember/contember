import { GraphQLBoolean, GraphQLInputFieldConfig, GraphQLInputFieldConfigMap, GraphQLInputObjectType } from 'graphql'
import { acceptFieldVisitor, getEntity } from '../../../content-schema/modelUtils'
import { GqlTypeName } from '../utils'
import { Acl, Model } from 'cms-common'
import Authorizator from '../../../acl/Authorizator'
import singletonFactory from '../../../utils/singletonFactory'
import { GraphQLInputType } from 'graphql/type/definition'

class EntityInputProvider<Operation extends EntityInputProvider.Type.create | EntityInputProvider.Type.update> {
	private entityInputs = singletonFactory<
		GraphQLInputType | undefined,
		{
			entityName: string
			withoutRelation?: string
		}
	>(id => this.createInput(id.entityName, id.withoutRelation))

	constructor(
		private operation: Operation,
		private schema: Model.Schema,
		private authorizator: Authorizator,
		private visitor: Model.FieldVisitor<GraphQLInputFieldConfig | undefined>
	) {}

	public getInput(entityName: string, withoutRelation?: string): GraphQLInputType | undefined {
		return this.entityInputs({ entityName, withoutRelation })
	}

	protected createInput(entityName: string, withoutRelation?: string) {
		const withoutSuffix = withoutRelation ? GqlTypeName`Without${withoutRelation}` : ''

		const entity = getEntity(this.schema, entityName)
		const operation: Acl.Operation = (() => {
			switch (this.operation) {
				case EntityInputProvider.Type.create:
					return Acl.Operation.create
				case EntityInputProvider.Type.update:
					return Acl.Operation.update
				default:
					throw new Error()
			}
		})()
		if (!this.authorizator.isAllowed(operation, entity.name, entity.primary)) {
			return undefined
		}

		const fieldNames = Object.keys(entity.fields)
			.filter(it => it !== entity.primary)
			.filter(it => it !== withoutRelation)

		return new GraphQLInputObjectType({
			name: GqlTypeName`${entityName}${withoutSuffix}${this.operation}Input`,
			fields: () => this.createEntityFields(entityName, fieldNames),
		})
	}

	private createEntityFields(entityName: string, fieldsNames: string[]) {
		const fields: GraphQLInputFieldConfigMap = {}
		for (const fieldName of fieldsNames) {
			const result = acceptFieldVisitor(this.schema, entityName, fieldName, this.visitor)
			if (result !== undefined) {
				fields[fieldName] = result
			}
		}

		fields['_' + this.operation] = {type: GraphQLBoolean}

		return fields
	}
}

namespace EntityInputProvider {
	export enum Type {
		create = 'create',
		update = 'update',
	}
}

export default EntityInputProvider
