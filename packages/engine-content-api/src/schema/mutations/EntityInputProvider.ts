import {
	GraphQLBoolean,
	GraphQLInputFieldConfig,
	GraphQLInputFieldConfigMap,
	GraphQLInputObjectType,
	GraphQLInputType,
} from 'graphql'
import { acceptFieldVisitor, getEntity } from '@contember/schema-utils'
import { GqlTypeName } from '../utils'
import { Acl, Model } from '@contember/schema'
import { Authorizator } from '../../acl'
import { singletonFactory } from '../../utils'
import { ImplementationException } from '../../exception'

export class EntityInputProvider<Operation extends EntityInputType> {
	private entityInputs = singletonFactory<
		GraphQLInputType | undefined,
		{
			entityName: string
			withoutRelation?: string
		}
	>(id => this.createInput(getEntity(this.schema, id.entityName), id.withoutRelation))

	constructor(
		private readonly operation: Operation,
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly visitor: Model.FieldVisitor<GraphQLInputFieldConfig | undefined>,
	) {}

	public getInput(entityName: string, withoutRelation?: string): GraphQLInputType | undefined {
		return this.entityInputs({ entityName, withoutRelation })
	}

	protected createInput(entity: Model.Entity, withoutRelation?: string): GraphQLInputObjectType | undefined {
		if (entity.view) {
			return undefined
		}
		const entityName = entity.name
		const withoutSuffix = withoutRelation ? GqlTypeName`Without${withoutRelation}` : ''
		const operation: Acl.Operation = (() => {
			switch (this.operation) {
				case EntityInputType.create:
					return Acl.Operation.create
				case EntityInputType.update:
					return Acl.Operation.update
				default:
					throw new ImplementationException(`EntityInputProvider: Invalid operation ${this.operation}`)
			}
		})()
		if (this.authorizator.getEntityPermission(operation, entity.name) === 'no') {
			return undefined
		}

		const fieldNames = Object.keys(entity.fields).filter(it => it !== withoutRelation)

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

		fields['_dummy_field_'] = { type: GraphQLBoolean }

		return fields
	}
}

export enum EntityInputType {
	create = 'create',
	update = 'update',
}
