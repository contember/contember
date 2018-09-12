import { GraphQLBoolean, GraphQLInputFieldConfig, GraphQLInputFieldConfigMap, GraphQLInputObjectType } from 'graphql'
import { acceptFieldVisitor, getEntity } from '../../../content-schema/modelUtils'
import { GqlTypeName } from '../utils'
import { Acl, Model } from 'cms-common'
import Authorizator from '../../../acl/Authorizator'
import singletonFactory from '../../../utils/singletonFactory'
import { GraphQLInputType } from 'graphql/type/definition'

export default class EntityInputProvider<
	Operation extends Acl.Operation.create | Acl.Operation.update
> {
	private entityInputs = singletonFactory<
		GraphQLInputType,
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

	public getInput(entityName: string, withoutRelation?: string): GraphQLInputType {
		return this.entityInputs({ entityName, withoutRelation })
	}

	protected createInput(entityName: string, withoutRelation?: string) {
		const withoutSuffix = withoutRelation ? GqlTypeName`Without${withoutRelation}` : ''

		const entity = getEntity(this.schema, entityName)

		const fields = Object.keys(entity.fields)
			.filter(it => it !== entity.primary)
			.filter(it => it !== withoutRelation)
			.filter(it => this.authorizator.isAllowed(this.operation, entityName, it))

		if (fields.length === 0) {
			return GraphQLBoolean
		}

		return new GraphQLInputObjectType({
			name: GqlTypeName`${entityName}${withoutSuffix}${this.operation}Input`,
			fields: () => this.createEntityFields(entityName, fields, withoutRelation)
		})
	}

	private createEntityFields(entityName: string, fieldsNames: string[], withoutRelation?: string) {
		const fields: GraphQLInputFieldConfigMap = {}
		for (const fieldName of fieldsNames) {
			if (withoutRelation && fieldName === withoutRelation) {
				continue
			}
			const result = acceptFieldVisitor(this.schema, entityName, fieldName, this.visitor)
			if (result !== undefined) {
				fields[fieldName] = result
			}
		}

		return fields
	}
}
