import { Acl, Model } from '@contember/schema'
import { acceptFieldVisitor, getEntity } from '@contember/schema-utils'
import { InputField } from '@contember/graphql-json'
import { Authorizator } from '../acl/index.js'
import { FieldAccessVisitor } from '../schema/FieldAccessVisitor.js'
import { GqlTypeName } from '../schema/utils.js'
import { capitalizeFirstLetter, getFieldsForUniqueWhere } from '../utils/index.js'
import { ImplementationException } from '../exception.js'
import { JsonColumnTypes } from './JsonColumnTypes.js'
import { JsonTypeRegistry, listOfNonNullRef, listRef, namedRef } from './JsonTypeRegistry.js'

/** JSON counterpart of `WhereTypeProvider`, `ConditionTypeProvider` and `OrderByTypeProvider`. */
export class JsonFilterTypes {
	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly registry: JsonTypeRegistry,
		private readonly columnTypes: JsonColumnTypes,
	) {}

	public getEntityWhereType(entityName: string): string {
		if (this.authorizator.getEntityPermission(Acl.Operation.read, entityName) === 'no') {
			throw new ImplementationException()
		}
		const name = GqlTypeName`${entityName}Where`
		return this.registry.inputObject(name, () => this.getEntityWhereFields(entityName, name))
	}

	public getEntityUniqueWhereType(entityName: string): string | undefined {
		if (this.authorizator.getEntityPermission(Acl.Operation.read, entityName) === 'no') {
			return undefined
		}
		const name = capitalizeFirstLetter(entityName) + 'UniqueWhere'
		if (this.registry.has(name)) {
			return name
		}
		const entity = getEntity(this.schema, entityName)
		const uniqueKeys = getFieldsForUniqueWhere(this.schema, entity).filter(uniqueKey =>
			uniqueKey.every(it => acceptFieldVisitor(this.schema, entityName, it, new FieldAccessVisitor(Acl.Operation.read, this.authorizator)))
		)
		return this.registry.inputObject(name, () => this.getUniqueWhereFields(entity, uniqueKeys))
	}

	public getUniqueWhereFields(entity: Model.Entity, uniqueKeys: (readonly string[])[]): Record<string, InputField> {
		const fields: Record<string, InputField> = {}
		for (const uniqueKey of uniqueKeys) {
			for (const field of uniqueKey) {
				if (fields[field] !== undefined) {
					continue
				}
				fields[field] = acceptFieldVisitor<InputField>(this.schema, entity, field, {
					visitRelation: ({ targetEntity }) => {
						const uniqueWhere = this.getEntityUniqueWhereType(targetEntity.name)
						if (!uniqueWhere) {
							throw new ImplementationException()
						}
						return [namedRef(uniqueWhere)]
					},
					visitColumn: ({ column }) => [this.columnTypes.getType(column).type],
				})
			}
		}
		return fields
	}

	public getEntityOrderByType(entityName: string): string {
		return this.registry.inputObject(GqlTypeName`${entityName}OrderBy`, () => this.getEntityOrderByFields(entityName))
	}

	private getEntityWhereFields(entityName: string, whereName: string): Record<string, InputField> {
		const fields: Record<string, InputField> = {}
		const entity = this.schema.entities[entityName]
		for (const fieldName in entity.fields) {
			const accessVisitor = new FieldAccessVisitor(Acl.Operation.read, this.authorizator)
			if (!acceptFieldVisitor(this.schema, entityName, fieldName, accessVisitor)) {
				continue
			}
			fields[fieldName] = acceptFieldVisitor<InputField>(this.schema, entityName, fieldName, {
				visitColumn: ({ column }) => [namedRef(this.getCondition(column))],
				visitRelation: ({ relation }) => [namedRef(this.getEntityWhereType(relation.target))],
			})
		}
		fields.and = [listRef(whereName)]
		fields.or = [listRef(whereName)]
		fields.not = [namedRef(whereName)]
		return fields
	}

	private getCondition(column: Model.AnyColumn): string {
		const { baseName } = this.columnTypes.getType(column)
		const suffix = column.type === Model.ColumnType.Enum ? 'Enum' : ''
		const arraySuffix = column.list ? 'List' : ''
		const name = GqlTypeName`${baseName}${suffix}${arraySuffix}Condition`
		return this.registry.inputObject(name, () => {
			const conditions: Record<string, InputField> = {
				and: [listOfNonNullRef(name)],
				or: [listOfNonNullRef(name)],
				not: [namedRef(name)],
				null: [namedRef(this.columnTypes.getScalar(Model.ColumnType.Bool))],
				isNull: [namedRef(this.columnTypes.getScalar(Model.ColumnType.Bool))],
			}
			const int = () => [namedRef(this.columnTypes.getScalar(Model.ColumnType.Int))] satisfies InputField
			const string = () => [namedRef(this.columnTypes.getScalar(Model.ColumnType.String))] satisfies InputField
			if (column.list) {
				conditions.minLength = int()
				conditions.maxLength = int()
				conditions.includes = [namedRef(baseName)]
			} else {
				if (column.type !== Model.ColumnType.Json) {
					conditions.eq = [namedRef(baseName)]
					conditions.notEq = [namedRef(baseName)]
					conditions.in = [listOfNonNullRef(baseName)]
					conditions.notIn = [listOfNonNullRef(baseName)]
					conditions.lt = [namedRef(baseName)]
					conditions.lte = [namedRef(baseName)]
					conditions.gt = [namedRef(baseName)]
					conditions.gte = [namedRef(baseName)]
				} else {
					conditions.includes = [namedRef(baseName)]
				}
				if (column.type === Model.ColumnType.String) {
					conditions.contains = string()
					conditions.startsWith = string()
					conditions.endsWith = string()
					conditions.containsCI = string()
					conditions.startsWithCI = string()
					conditions.endsWithCI = string()
					conditions.similar = string()
					conditions.wordSimilar = string()
				}
			}
			return conditions
		})
	}

	private getEntityOrderByFields(entityName: string): Record<string, InputField> {
		const orderDirection = this.registry.enum('OrderDirection', ['asc', 'desc', 'ascNullsFirst', 'descNullsLast'])
		const fields: Record<string, InputField> = {
			_random: [namedRef(this.columnTypes.getScalar(Model.ColumnType.Bool))],
			_randomSeeded: [namedRef(this.columnTypes.getScalar(Model.ColumnType.Int))],
		}
		const entity = this.schema.entities[entityName]
		for (const fieldName in entity.fields) {
			const accessVisitor = new FieldAccessVisitor(Acl.Operation.read, this.authorizator)
			if (!acceptFieldVisitor(this.schema, entityName, fieldName, accessVisitor)) {
				continue
			}
			const field = acceptFieldVisitor<InputField | undefined>(this.schema, entityName, fieldName, {
				visitColumn: ({ column }) => column.list ? undefined : [namedRef(orderDirection)],
				visitHasOne: ({ relation }) => [namedRef(this.getEntityOrderByType(relation.target))],
				visitHasMany: () => undefined,
			})
			if (field !== undefined) {
				fields[fieldName] = field
			}
		}
		return fields
	}
}
