import { GraphQLFieldConfig, GraphQLObjectType, GraphQLObjectTypeConfig, GraphQLOutputType } from 'graphql'
import { JoinMonsterEntityMapping, JoinMonsterFieldMapping } from '../joinMonsterHelpers'
import { Model } from 'cms-common'
import { acceptFieldVisitor, getEntity } from '../../content-schema/modelUtils'
import { quoteIdentifier } from '../sql/utils'
import singletonFactory from '../../utils/singletonFactory'
import ColumnTypeResolver from './ColumnTypeResolver'
import FieldTypeVisitor from './entities/FieldTypeVisitor'
import JoinMonsterFieldMappingVisitor from './entities/JoinMonsterFieldMappingVisitor'
import { GqlTypeName } from './utils'
import WhereTypeProvider from './WhereTypeProvider'

export default class EntityTypeProvider {
	private schema: Model.Schema
	private columnTypeResolver: ColumnTypeResolver
	private whereTypeProvider: WhereTypeProvider

	private entities = singletonFactory(name => this.createEntity(name))

	constructor(schema: Model.Schema, columnTypeResolver: ColumnTypeResolver, whereTypeProvider: WhereTypeProvider) {
		this.schema = schema
		this.columnTypeResolver = columnTypeResolver
		this.whereTypeProvider = whereTypeProvider
	}

	public getEntity(entityName: string): GraphQLObjectType {
		return this.entities(entityName)
	}

	private createEntity(entityName: string) {
		const entity = getEntity(this.schema, entityName)
		const entityMapping: JoinMonsterEntityMapping = {
			sqlTable: quoteIdentifier(entity.tableName),
			uniqueKey: entity.primaryColumn
		}

		return new GraphQLObjectType({
			name: GqlTypeName`${entityName}`,
			fields: () => this.getEntityFields(entityName),
			...entityMapping
		} as GraphQLObjectTypeConfig<any, any>)
	}

	private getEntityFields(entityName: string) {
		const entity = getEntity(this.schema, entityName)
		const fields: { [field: string]: GraphQLFieldConfig<any, any> & JoinMonsterFieldMapping<any, any> } = {}

		for (const fieldName in entity.fields) {
			if (!entity.fields.hasOwnProperty(fieldName)) {
				continue
			}

			const fieldTypeVisitor = new FieldTypeVisitor(this.columnTypeResolver, this)
			const type: GraphQLOutputType = acceptFieldVisitor(this.schema, entity, fieldName, fieldTypeVisitor)

			const joinMonsterVisitor = new JoinMonsterFieldMappingVisitor(this.schema, this.whereTypeProvider)
			fields[fieldName] = {
				type,
				...acceptFieldVisitor(this.schema, entity, fieldName, joinMonsterVisitor)
			}
		}
		return fields
	}
}
