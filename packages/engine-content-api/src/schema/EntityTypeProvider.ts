import {
	GraphQLBoolean,
	GraphQLFieldConfig,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLObjectTypeConfig,
	GraphQLOutputType,
} from 'graphql'
import { Acl, Input, Model } from '@contember/schema'
import { acceptFieldVisitor, getEntity as getEntityFromSchema } from '@contember/schema-utils'
import { singletonFactory } from '../utils'
import { ColumnTypeResolver } from './ColumnTypeResolver'
import { FieldArgsVisitor, FieldTypeVisitor } from './entities'
import { aliasAwareResolver, GqlTypeName } from './utils'
import { WhereTypeProvider } from './WhereTypeProvider'
import { Authorizator } from '../acl'
import { FieldAccessVisitor } from './FieldAccessVisitor'
import { OrderByTypeProvider } from './OrderByTypeProvider'
import { EntityFieldsProvider } from '../extensions'
import { ImplementationException } from '../exception'

export class EntityTypeProvider {
	private entities = singletonFactory(name => this.createEntity(name))
	private connections = singletonFactory(name => this.createConnection(name))
	private PageInfo = new GraphQLObjectType({
		name: 'PageInfo',
		fields: {
			totalCount: { type: new GraphQLNonNull(GraphQLInt) },
		},
	})

	private fieldMeta = new GraphQLObjectType({
		name: 'FieldMeta',
		fields: {
			[Input.FieldMeta.readable]: { type: GraphQLBoolean, resolve: aliasAwareResolver },
			[Input.FieldMeta.updatable]: { type: GraphQLBoolean, resolve: aliasAwareResolver },
		},
	})
	private readonly entityFieldProviders: { [key: string]: EntityFieldsProvider } = {}

	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly whereTypeProvider: WhereTypeProvider,
		private readonly orderByTypeProvider: OrderByTypeProvider,
	) {
	}

	public registerEntityFieldProvider(key: string, provider: EntityFieldsProvider): void {
		this.entityFieldProviders[key] = provider
	}

	public getEntity(entityName: string): GraphQLObjectType {
		if (this.authorizator.getEntityPermission(Acl.Operation.read, entityName) === 'no') {
			throw new ImplementationException()
		}
		return this.entities(entityName)
	}

	public getConnection(entityName: string): GraphQLObjectType {
		if (this.authorizator.getEntityPermission(Acl.Operation.read, entityName) === 'no') {
			throw new ImplementationException()
		}
		return this.connections(entityName)
	}

	private createEntity(entityName: string) {
		return new GraphQLObjectType({
			name: GqlTypeName`${entityName}`,
			fields: () => this.getEntityFields(entityName),
		} as GraphQLObjectTypeConfig<any, any>)
	}

	private getEntityFields(entityName: string) {
		const entity = getEntityFromSchema(this.schema, entityName)
		const accessVisitor = new FieldAccessVisitor(Acl.Operation.read, this.authorizator)
		const accessibleFields = Object.values(entity.fields).filter(field =>
			acceptFieldVisitor(this.schema, entity, field.name, accessVisitor),
		)
		const metaFields: { [field: string]: GraphQLFieldConfig<any, any> } = {}
		for (const field of accessibleFields) {
			metaFields[field.name] = {
				type: this.fieldMeta,
				resolve: aliasAwareResolver,
			}
		}

		const metaField = {
			type: new GraphQLObjectType({
				name: GqlTypeName`${entityName}Meta`,
				fields: metaFields,
			}),
			resolve: aliasAwareResolver,
		}

		let fields: { [field: string]: GraphQLFieldConfig<any, any> } = {
			_meta: metaField,
		}

		const fieldConfigs = accessibleFields.map(field => {
			const fieldTypeVisitor = new FieldTypeVisitor(this.columnTypeResolver, this, this.authorizator)
			const type: GraphQLOutputType = acceptFieldVisitor(this.schema, entity, field.name, fieldTypeVisitor)
			const fieldArgsVisitor = new FieldArgsVisitor(this.whereTypeProvider, this.orderByTypeProvider)

			return {
				key: field.name,
				config: {
					type,
					args: acceptFieldVisitor(this.schema, entity, field.name, fieldArgsVisitor),
					resolve: aliasAwareResolver,
					deprecationReason: field.deprecationReason,
				},
			}
		})

		fields = {
			...fields,
			...Object.fromEntries(fieldConfigs.map(({ key, config }) => [key, config])),
		}

		for (const [_key, provider] of Object.entries(this.entityFieldProviders)) {
			fields = {
				...fields,
				...provider.getFields(entity, accessibleFields),
			}
		}

		return fields
	}

	private createConnection(entityName: string) {
		const entityType = this.getEntity(entityName)
		return new GraphQLObjectType({
			name: GqlTypeName`${entityName}Connection`,
			fields: {
				pageInfo: {
					type: new GraphQLNonNull(this.PageInfo),
				},
				edges: {
					type: new GraphQLNonNull(
						new GraphQLList(
							new GraphQLNonNull(
								new GraphQLObjectType({
									name: GqlTypeName`${entityName}Edge`,
									fields: {
										node: {
											type: new GraphQLNonNull(entityType),
											// resolve: aliasAwareResolver,
										},
									},
								}),
							),
						),
					),
					// resolve: aliasAwareResolver,
				},
			},
		})
	}
}
