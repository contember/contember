import { GraphQLBoolean, GraphQLFieldConfig, GraphQLObjectType, GraphQLObjectTypeConfig, GraphQLOutputType, } from 'graphql'
import { Acl, Input, Model } from 'cms-common'
import { acceptFieldVisitor, getEntity as getEntityFromSchema } from '../../content-schema/modelUtils'
import singletonFactory from '../../utils/singletonFactory'
import ColumnTypeResolver from './ColumnTypeResolver'
import FieldTypeVisitor from './entities/FieldTypeVisitor'
import FieldArgsVisitor from './entities/FieldArgsVisitor'
import { GqlTypeName } from './utils'
import WhereTypeProvider from './WhereTypeProvider'
import Authorizator from '../../acl/Authorizator'
import { GraphQLFieldResolver } from 'graphql/type/definition'
import { FieldAccessVisitor } from './FieldAccessVisitor'
import OrderByTypeProvider from './OrderByTypeProvider'

export default class EntityTypeProvider {
	private entities = singletonFactory(name => this.createEntity(name))

	private aliasAwareResolver: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
		if (!info.path) {
			return undefined
		}
		return source[info.path.key]
	}

	private fieldMeta = new GraphQLObjectType({
		name: 'FieldMeta',
		fields: {
			[Input.FieldMeta.readable]: { type: GraphQLBoolean, resolve: this.aliasAwareResolver },
			[Input.FieldMeta.updatable]: { type: GraphQLBoolean, resolve: this.aliasAwareResolver },
		},
	})


	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly whereTypeProvider: WhereTypeProvider,
		private readonly orderByTypeProvider: OrderByTypeProvider
	) {
	}

	public getEntity(entityName: string): GraphQLObjectType {
		return this.entities(entityName)
	}

	private createEntity(entityName: string) {
		return new GraphQLObjectType({
			name: GqlTypeName`${entityName}`,
			fields: () => this.getEntityFields(entityName),
		} as GraphQLObjectTypeConfig<any, any>)
	}

	private getEntityFields(entityName: string) {
		const entity = getEntityFromSchema(this.schema, entityName)
		const fields: { [field: string]: GraphQLFieldConfig<any, any> } = {}
		const metaFields: { [field: string]: GraphQLFieldConfig<any, any> } = {}
		fields['_meta'] = {
			type: new GraphQLObjectType({
				name: GqlTypeName`${entityName}Meta`,
				fields: metaFields,
			}),
			resolve: this.aliasAwareResolver,
		}

		for (const fieldName in entity.fields) {
			if (!entity.fields.hasOwnProperty(fieldName)) {
				continue
			}
			if (
				!acceptFieldVisitor(
					this.schema,
					entity,
					fieldName,
					new FieldAccessVisitor(Acl.Operation.read, this.authorizator)
				)
			) {
				continue
			}

			const fieldTypeVisitor = new FieldTypeVisitor(this.columnTypeResolver, this)
			const type: GraphQLOutputType = acceptFieldVisitor(this.schema, entity, fieldName, fieldTypeVisitor)

			const fieldArgsVisitor = new FieldArgsVisitor(this.whereTypeProvider, this.orderByTypeProvider)

			fields[fieldName] = {
				type,
				args: acceptFieldVisitor(this.schema, entity, fieldName, fieldArgsVisitor),
				resolve: this.aliasAwareResolver,
			}
			metaFields[fieldName] = {
				type: this.fieldMeta,
				resolve: this.aliasAwareResolver,
			}
		}
		return fields
	}
}
