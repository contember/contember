import { GraphQLBoolean, GraphQLFieldConfig, GraphQLObjectType, GraphQLObjectTypeConfig, GraphQLOutputType } from 'graphql'
import { Acl, Model } from 'cms-common'
import { acceptFieldVisitor, getEntity as getEntityFromSchema } from '../../content-schema/modelUtils'
import singletonFactory from '../../utils/singletonFactory'
import ColumnTypeResolver from './ColumnTypeResolver'
import FieldTypeVisitor from './entities/FieldTypeVisitor'
import FieldArgsVisitor from './entities/FieldArgsVisitor'
import { GqlTypeName } from './utils'
import WhereTypeProvider from './WhereTypeProvider'
import Authorizator from '../../acl/Authorizator'
import { GraphQLFieldResolver } from 'graphql/type/definition'
import { FieldAccessVisitor } from "./FieldAccessVisitor";

export default class EntityTypeProvider {
	private entities = singletonFactory(name => this.createEntity(name))
	private fieldMeta = new GraphQLObjectType({
		name: 'FieldMeta',
		fields: {
			readable: {type: GraphQLBoolean},
			updatable: {type: GraphQLBoolean},
		}
	})

	constructor(
		private schema: Model.Schema,
		private authorizator: Authorizator,
		private columnTypeResolver: ColumnTypeResolver,
		private whereTypeProvider: WhereTypeProvider
	) {}

	public getEntity(entityName: string): GraphQLObjectType {
		return this.entities(entityName)
	}

	private createEntity(entityName: string) {
		return new GraphQLObjectType({
			name: GqlTypeName`${entityName}`,
			fields: () => this.getEntityFields(entityName)
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
			})
		}

		for (const fieldName in entity.fields) {
			if (!entity.fields.hasOwnProperty(fieldName)) {
				continue
			}
			if (!acceptFieldVisitor(this.schema, entity, fieldName, new FieldAccessVisitor(Acl.Operation.read, this.authorizator))) {
				continue
			}

			const fieldTypeVisitor = new FieldTypeVisitor(this.columnTypeResolver, this)
			const type: GraphQLOutputType = acceptFieldVisitor(this.schema, entity, fieldName, fieldTypeVisitor)

			const fieldArgsVisitor = new FieldArgsVisitor(this.whereTypeProvider)
			const fieldResolver: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
				if (!info.path) {
					return undefined
				}
				return source[info.path.key]
			}
			fields[fieldName] = {
				type,
				args: acceptFieldVisitor(this.schema, entity, fieldName, fieldArgsVisitor),
				resolve: fieldResolver
			}
			metaFields[fieldName] = {
				type: this.fieldMeta,
			}
		}
		return fields
	}
}
