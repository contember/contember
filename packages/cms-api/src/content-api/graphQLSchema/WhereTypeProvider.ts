import { GraphQLInputObjectType, GraphQLList } from 'graphql'
import { GraphQLInputFieldConfig, GraphQLInputFieldConfigMap, GraphQLNonNull } from 'graphql/type/definition'
import { Acl, Model } from 'cms-common'
import { acceptFieldVisitor, getEntity, getUniqueConstraints } from '../../content-schema/modelUtils'
import singletonFactory from '../../utils/singletonFactory'
import { capitalizeFirstLetter } from '../../utils/strings'
import { isIt } from '../../utils/type'
import ColumnTypeResolver from './ColumnTypeResolver'
import ConditionTypeProvider from './ConditionTypeProvider'
import { GqlTypeName } from './utils'
import Authorizator from '../../acl/Authorizator'
import { FieldAccessVisitor } from './FieldAccessVisitor'

export default class WhereTypeProvider {
	private whereSingleton = singletonFactory(name => this.createEntityWhereType(name))
	private uniqueWhereSingleton = singletonFactory(name => this.createEntityUniqueWhereType(name))

	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly conditionTypeProvider: ConditionTypeProvider,
	) {}

	public getEntityWhereType(entityName: string): GraphQLInputObjectType {
		return this.whereSingleton(entityName)
	}

	public getEntityUniqueWhereType(entityName: string): GraphQLInputObjectType {
		return this.uniqueWhereSingleton(entityName)
	}

	private createEntityWhereType(entityName: string) {
		const where: GraphQLInputObjectType = new GraphQLInputObjectType({
			name: GqlTypeName`${entityName}Where`,
			fields: () => this.getEntityWhereFields(entityName, where),
		})

		return where
	}

	private createEntityUniqueWhereType(entityName: string, withoutRelation?: string) {
		const entity = getEntity(this.schema, entityName)

		const combinations: string[] = []

		const definedUniqueKeys = getUniqueConstraints(this.schema, entity).map(it => it.fields)
		const uniqueKeys: string[][] = [[entity.primary], ...definedUniqueKeys].filter(uniqueKey =>
			uniqueKey.every(it =>
				acceptFieldVisitor(this.schema, entityName, it, new FieldAccessVisitor(Acl.Operation.read, this.authorizator)),
			),
		)
		for (const uniqueKey of uniqueKeys) {
			combinations.push(uniqueKey.join(', '))
		}

		return new GraphQLInputObjectType({
			name: capitalizeFirstLetter(entityName) + 'UniqueWhere',
			// description: `Valid combinations are: (${combinations.join('), (')})`, generates invalid schema file
			fields: () => this.getUniqueWhereFields(entity, uniqueKeys),
		})
	}

	public getUniqueWhereFields(entity: Model.Entity, uniqueKeys: string[][]) {
		const fields: GraphQLInputFieldConfigMap = {}
		for (const uniqueKey of uniqueKeys) {
			for (const field of uniqueKey) {
				if (fields[field] !== undefined) {
					continue
				}
				fields[field] = acceptFieldVisitor<GraphQLInputFieldConfig>(this.schema, entity, field, {
					visitRelation: (entity, relation, targetEntity) => {
						// if (!isIt<Model.JoiningColumnRelation>(relation, 'joiningColumn')) {
						// 	throw new Error('Only column or owning relation can be a part of unique key')
						// }
						return { type: this.getEntityUniqueWhereType(targetEntity.name) }
					},
					visitColumn: (entity, column) => ({ type: this.columnTypeResolver.getType(column) }),
				})
			}
		}
		return fields
	}

	private getEntityWhereFields(name: string, where: GraphQLInputObjectType) {
		const fields: GraphQLInputFieldConfigMap = {}
		const entity = this.schema.entities[name]

		for (const fieldName in entity.fields) {
			if (!entity.fields.hasOwnProperty(fieldName)) {
				continue
			}
			const accessVisitor = new FieldAccessVisitor(Acl.Operation.read, this.authorizator)
			if (!acceptFieldVisitor(this.schema, name, fieldName, accessVisitor)) {
				continue
			}

			fields[fieldName] = acceptFieldVisitor(this.schema, name, fieldName, {
				visitColumn: (entity, column) => ({ type: this.conditionTypeProvider.getCondition(column) }),
				visitRelation: (entity, relation) => ({ type: this.getEntityWhereType(relation.target) }),
			} as Model.FieldVisitor<GraphQLInputFieldConfig>)
		}

		fields.and = { type: new GraphQLList(new GraphQLNonNull(where)) }
		fields.or = { type: new GraphQLList(new GraphQLNonNull(where)) }
		fields.not = { type: where }

		return fields
	}
}
