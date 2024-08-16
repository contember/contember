import { Acl, Model } from '@contember/schema'
import { acceptFieldVisitor, getEntity } from '@contember/schema-utils'
import { GraphQLInputFieldConfig, GraphQLInputFieldConfigMap, GraphQLInputObjectType, GraphQLList } from 'graphql'
import { capitalizeFirstLetter, getFieldsForUniqueWhere, singletonFactory } from '../utils'
import { ColumnTypeResolver } from './ColumnTypeResolver'
import { ConditionTypeProvider } from './ConditionTypeProvider'
import { GqlTypeName } from './utils'
import { Authorizator } from '../acl'
import { FieldAccessVisitor } from './FieldAccessVisitor'
import { ImplementationException } from '../exception'

export class WhereTypeProvider {
	private whereSingleton = singletonFactory(name => this.createEntityWhereType(name))
	private uniqueWhereSingleton = singletonFactory(name => this.createEntityUniqueWhereType(name))

	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly conditionTypeProvider: ConditionTypeProvider,
	) {}

	public getEntityWhereType(entityName: string): GraphQLInputObjectType {
		if (this.authorizator.getEntityPermission(Acl.Operation.read, entityName) === 'no') {
			throw new ImplementationException()
		}
		return this.whereSingleton(entityName)
	}

	public getEntityUniqueWhereType(entityName: string): undefined | GraphQLInputObjectType {
		if (this.authorizator.getEntityPermission(Acl.Operation.read, entityName) === 'no') {
			return undefined
		}
		return this.uniqueWhereSingleton(entityName)
	}

	private createEntityWhereType(entityName: string) {
		const entity = getEntity(this.schema, entityName)
		const where: GraphQLInputObjectType = new GraphQLInputObjectType({
			name: GqlTypeName`${entityName}Where`,
			description: entity.description,
			fields: () => this.getEntityWhereFields(entityName, where),
		})

		return where
	}

	private createEntityUniqueWhereType(entityName: string, withoutRelation?: string) {
		const entity = getEntity(this.schema, entityName)

		const combinations: string[] = []

		const possibleUniqueWhereFields = getFieldsForUniqueWhere(this.schema, entity)
		const uniqueKeys: (readonly string[])[] = possibleUniqueWhereFields.filter(uniqueKey =>
			uniqueKey.every(it =>
				acceptFieldVisitor(this.schema, entityName, it, new FieldAccessVisitor(Acl.Operation.read, this.authorizator)),
			),
		)
		for (const uniqueKey of uniqueKeys) {
			combinations.push(uniqueKey.join(', '))
		}

		return new GraphQLInputObjectType({
			name: capitalizeFirstLetter(entityName) + 'UniqueWhere',
			description: entity.description,
			// description: `Valid combinations are: (${combinations.join('), (')})`, generates invalid schema file
			fields: () => this.getUniqueWhereFields(entity, uniqueKeys),
		})
	}

	public getUniqueWhereFields(entity: Model.Entity, uniqueKeys: (readonly string[])[]) {
		const fields: GraphQLInputFieldConfigMap = {}
		for (const uniqueKey of uniqueKeys) {
			for (const field of uniqueKey) {
				if (fields[field] !== undefined) {
					continue
				}
				fields[field] = acceptFieldVisitor<GraphQLInputFieldConfig>(this.schema, entity, field, {
					visitRelation: ({ relation, targetEntity }) => {
						// if (!isIt<Model.JoiningColumnRelation>(relation, 'joiningColumn')) {
						// 	throw new Error('Only column or owning relation can be a part of unique key')
						// }
						const uniqueWhere = this.getEntityUniqueWhereType(targetEntity.name)
						if (!uniqueWhere) {
							throw new ImplementationException()
						}
						return {
							type: uniqueWhere,
							description: relation.description,
						}
					},
					visitColumn: ({ column }) => ({
						type: this.columnTypeResolver.getType(column),
						description: column.description,
					}),
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
				visitColumn: ({ column }) => ({
					type: this.conditionTypeProvider.getCondition(column),
					description: column.description,
				}),
				visitRelation: ({ relation }) => ({
					type: this.getEntityWhereType(relation.target),
					description: relation.description,
				}),
			} as Model.FieldVisitor<GraphQLInputFieldConfig>)
		}

		fields.and = { type: new GraphQLList(where) }
		fields.or = { type: new GraphQLList(where) }
		fields.not = { type: where }

		return fields
	}
}
