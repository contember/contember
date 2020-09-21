import { GraphQLFieldConfig, GraphQLObjectType, GraphQLObjectTypeConfig, GraphQLOutputType } from 'graphql'
import { Acl, Input, Model } from '@contember/schema'
import { acceptFieldVisitor, getEntity as getEntityFromSchema } from '@contember/schema-utils'
import singletonFactory from '../utils/singletonFactory'
import ColumnTypeResolver from './ColumnTypeResolver'
import FieldTypeVisitor from './entities/FieldTypeVisitor'
import FieldArgsVisitor from './entities/FieldArgsVisitor'
import { aliasAwareResolver, GqlTypeName } from './utils'
import WhereTypeProvider from './WhereTypeProvider'
import Authorizator from '../acl/Authorizator'
import { FieldAccessVisitor } from './FieldAccessVisitor'
import OrderByTypeProvider from './OrderByTypeProvider'
import EntityFieldsProvider from '../extensions/EntityFieldsProvider'
import { GraphQLObjectsFactory } from '@contember/graphql-utils'
import { ImplementationException } from '../exception'

class EntityTypeProvider {
	private entities = singletonFactory(name => this.createEntity(name))

	private fieldMeta = this.graphqlObjectFactories.createObjectType({
		name: 'FieldMeta',
		fields: {
			[Input.FieldMeta.readable]: { type: this.graphqlObjectFactories.boolean, resolve: aliasAwareResolver },
			[Input.FieldMeta.updatable]: { type: this.graphqlObjectFactories.boolean, resolve: aliasAwareResolver },
		},
	})

	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly whereTypeProvider: WhereTypeProvider,
		private readonly orderByTypeProvider: OrderByTypeProvider,
		private readonly entityFieldProviders: { [key: string]: EntityFieldsProvider },
		private readonly graphqlObjectFactories: GraphQLObjectsFactory,
	) {}

	public getEntity(entityName: string): GraphQLObjectType {
		if (!this.authorizator.isAllowed(Acl.Operation.read, entityName)) {
			throw new ImplementationException()
		}
		return this.entities(entityName)
	}

	private createEntity(entityName: string) {
		return this.graphqlObjectFactories.createObjectType({
			name: GqlTypeName`${entityName}`,
			fields: () => this.getEntityFields(entityName),
		} as GraphQLObjectTypeConfig<any, any>)
	}

	private getEntityFields(entityName: string) {
		const entity = getEntityFromSchema(this.schema, entityName)
		const accessVisitor = new FieldAccessVisitor(Acl.Operation.read, this.authorizator)
		const accessibleFields = Object.keys(entity.fields).filter(fieldName =>
			acceptFieldVisitor(this.schema, entity, fieldName, accessVisitor),
		)
		const metaFields: { [field: string]: GraphQLFieldConfig<any, any> } = accessibleFields.reduce(
			(result, fieldName) => ({
				...result,
				[fieldName]: {
					type: this.fieldMeta,
					resolve: aliasAwareResolver,
				},
			}),
			{},
		)

		const metaField = {
			type: this.graphqlObjectFactories.createObjectType({
				name: GqlTypeName`${entityName}Meta`,
				fields: metaFields,
			}),
			resolve: aliasAwareResolver,
		}

		const fields: { [field: string]: GraphQLFieldConfig<any, any> } = accessibleFields.reduce(
			(result, fieldName) => {
				const fieldTypeVisitor = new FieldTypeVisitor(this.columnTypeResolver, this, this.graphqlObjectFactories)
				const type: GraphQLOutputType = acceptFieldVisitor(this.schema, entity, fieldName, fieldTypeVisitor)

				const fieldArgsVisitor = new FieldArgsVisitor(
					this.whereTypeProvider,
					this.orderByTypeProvider,
					this.graphqlObjectFactories,
				)
				return {
					...result,
					[fieldName]: {
						type,
						args: acceptFieldVisitor(this.schema, entity, fieldName, fieldArgsVisitor),
						resolve: aliasAwareResolver,
					},
				}
			},
			{
				_meta: metaField,
			},
		)

		return Object.entries(this.entityFieldProviders)
			.map(([key, provider]) =>
				Object.entries(provider.getFields(entity, accessibleFields))
					.map(([fieldName, fieldConfig]): [string, GraphQLFieldConfig<any, any> & { meta: any }] => [
						fieldName,
						{ ...fieldConfig, meta: { ...(fieldConfig.meta || {}), extensionKey: key } },
					])
					.reduce((result, [name, value]) => ({ ...result, [name]: value }), {}),
			)
			.reduce((result, providerFields) => ({ ...result, ...providerFields }), fields)
	}
}

export default EntityTypeProvider
