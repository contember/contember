import { Model, Schema, Writable } from '@contember/schema'
import {
	acceptFieldVisitor,
	DefaultNamingConventions,
	isInverseRelation,
	NamingConventions,
	resolveDefaultColumnType,
} from '../model'
import { printJsValue } from '../utils/printJsValue'
import { DefinitionNamingConventions } from './DefinitionNamingConventions'
import { AclDefinitionCodeGenerator } from './AclDefinitionCodeGenerator'


export class DefinitionCodeGenerator {
	constructor(
		private readonly schemaNamingConventions: NamingConventions = new DefaultNamingConventions(),
		private readonly definitionNamingConventions = new DefinitionNamingConventions(),
		private readonly aclGenerator = new AclDefinitionCodeGenerator(),
	) {
	}

	public generate(schema: Schema) {
		const roles = this.aclGenerator.generateRoles({ acl: schema.acl })
		const aclVariables = this.aclGenerator.generateAclVariables({ acl: schema.acl })
		const enums = Object.entries(schema.model.enums).map(([name, values]) => this.generateEnum({ name, values })).join('')
		const entities = Object.values(schema.model.entities).map(entity => this.generateEntity({ entity, schema })).join('')

		return `import { c } from '@contember/schema-definition'\n${roles}${aclVariables}${enums}${entities}`
	}

	private generateEnum({ name, values }: { name: string; values: readonly string[] }): string {
		return `\nexport const ${this.formatIdentifier(name)} = c.createEnum(${values.map(it => printJsValue(it)).join(', ')})\n`
	}

	public generateEntity({ entity, schema }: { entity: Model.Entity; schema: Schema }): string {
		const uniqueConstraints = Object.values(entity.unique).map(constraint => this.generateUniqueConstraint({ entity, constraint }))
		const indexes = Object.values(entity.indexes).map(index => this.generateIndex({ entity, index }))
		const views = this.generateView({ entity })

		const decorators = [...uniqueConstraints, ...indexes, views].filter(it => !!it).map(it => `${it}\n`).join('')
		const acl = this.aclGenerator.generateEntityAcl({ entity, schema })

		return `\n${decorators}${acl}export class ${this.formatIdentifier(entity.name)} {
${Object.values(entity.fields).map(field => this.generateField({ field, entity, schema })).filter(it => !!it).join('\n')}
}\n`
	}

	private generateUniqueConstraint({ entity, constraint }: { entity: Model.Entity; constraint: Model.UniqueConstraint | Model.UniqueIndex }): string {
		const fieldsList = `${constraint.fields.map(it => printJsValue(it)).join(', ')}`

		return `@c.Unique(${fieldsList})`
	}

	private generateIndex({ entity, index }: { entity: Model.Entity; index: Model.Index }): string {
		const fieldsList = `${index.fields.map(it => printJsValue(it)).join(', ')}`

		return `@c.Index(${fieldsList})`
	}


	private generateView({ entity }: { entity: Model.Entity }): string | undefined {
		if (!entity.view) {
			return undefined
		}

		const dependenciesExpr = (entity.view.dependencies?.length ?? 0) > 0
			? `, {\n\tdependencies: () => [${entity.view.dependencies?.map(it => this.formatIdentifier(it))}]\n}`
			: ''

		return `@c.View(\`${entity.view.sql}\`${dependenciesExpr})`
	}

	public generateField({ entity, field, schema }: { entity: Model.Entity; field: Model.AnyField; schema: Schema }): string | undefined {
		const formatRelationFactory = (method: string, relation: Model.AnyRelation) => {
			const otherSide = isInverseRelation(relation) ? relation.ownedBy : relation.inversedBy
			const otherSideFormatted = otherSide ? `, ${printJsValue(otherSide)}` : ''
			return `${method}(${this.formatIdentifier(relation.target)}${otherSideFormatted})`
		}
		const formatEnumRef = (enumName: string, enumValues: Record<string, string>, providedValue?: string, defaultValue?: string): string | undefined => {
			if (!providedValue || providedValue === defaultValue) {
				return undefined
			}
			const enumValueKey = Object.entries(Model.OrderDirection).find(dir => dir[1] === providedValue)?.[0]
			if (!enumValueKey) {
				throw new Error(`Value ${providedValue} is not defined in enum ${enumName}`)
			}
			return `${enumName}.${enumValueKey}`

		}
		const formatOrderBy = (orderBy?: readonly Model.OrderBy[]) => {
			return orderBy?.map(it => {
				const enumExpr = formatEnumRef(`Model.OrderDirection`, Model.OrderDirection, it.direction, Model.OrderDirection.asc)
				return `orderBy(${printJsValue(it.path)}${enumExpr ? `, ${enumExpr}` : ''})`
			}) ?? []
		}
		const formatOnDelete = (onDelete?: Model.OnDelete): string | undefined => {
			if (onDelete === Model.OnDelete.cascade) {
				return 'cascadeOnDelete()'
			}
			if (onDelete === Model.OnDelete.setNull) {
				return 'setNullOnDelete()'
			}
			return undefined
		}
		const formatJoiningColumn = (joiningColumnName: string, fieldName: string): string | undefined => {
			const defaultJoiningColumn = this.schemaNamingConventions.getJoiningColumnName(fieldName)
			if (defaultJoiningColumn === joiningColumnName) {
				return undefined
			}
			return `joiningColumn(${printJsValue(joiningColumnName)})`
		}
		const formatDeprecationReason = (deprecationReason?: string): string | undefined => {
			if (!deprecationReason) {
				return undefined
			}
			return `deprecated(${printJsValue(deprecationReason)})`
		}
		const definition = acceptFieldVisitor<(string | undefined)[]>(schema.model, entity, field, {
			visitColumn: ctx => {
				return this.generateColumn(ctx)
			},
			visitOneHasMany: ({ relation }) => {
				return [
					formatRelationFactory('oneHasMany', relation),
					...formatOrderBy(relation.orderBy),
				]
			},
			visitManyHasOne: ({ relation }) => {
				return [
					formatRelationFactory('manyHasOne', relation),
					!relation.nullable ? 'notNull()' : undefined,
					formatOnDelete(relation.joiningColumn.onDelete),
					formatJoiningColumn(relation.joiningColumn.columnName, relation.name),
					formatDeprecationReason(relation.deprecationReason),
				]
			},
			visitOneHasOneInverse: ({ relation }) => {
				return [
					formatRelationFactory('oneHasOneInverse', relation),
					!relation.nullable ? 'notNull()' : undefined,
					formatDeprecationReason(relation.deprecationReason),
				]
			},
			visitOneHasOneOwning: ({ relation }) => {
				return [
					formatRelationFactory('oneHasOne', relation),
					!relation.nullable ? 'notNull()' : undefined,
					formatOnDelete(relation.joiningColumn.onDelete),
					formatJoiningColumn(relation.joiningColumn.columnName, relation.name),
					relation.orphanRemoval ? 'removeOrphan()' : undefined,
					formatDeprecationReason(relation.deprecationReason),
				]
			},
			visitManyHasManyOwning: ({ entity, relation }) => {
				const columnNames = this.schemaNamingConventions.getJoiningTableColumnNames(
					entity.name,
					relation.name,
					relation.target,
					relation.inversedBy,
				)
				const defaultJoiningTable = this.schemaNamingConventions.getJoiningTableName(entity.name, relation.name)
				const joiningTable: Writable<Partial<Model.JoiningTable>> = {}
				if (relation.joiningTable.tableName !== defaultJoiningTable) {
					joiningTable.tableName = relation.joiningTable.tableName
				}
				if (!relation.joiningTable.eventLog.enabled) {
					joiningTable.eventLog = { enabled: false }
				}
				if (columnNames[0] !== relation.joiningTable.joiningColumn.columnName || relation.joiningTable.joiningColumn.onDelete !== Model.OnDelete.cascade) {
					joiningTable.joiningColumn = {
						columnName: relation.joiningTable.joiningColumn.columnName,
						onDelete: relation.joiningTable.joiningColumn.onDelete,
					}
				}
				if (columnNames[1] !== relation.joiningTable.inverseJoiningColumn.columnName || relation.joiningTable.inverseJoiningColumn.onDelete !== Model.OnDelete.cascade) {
					joiningTable.inverseJoiningColumn = {
						columnName: relation.joiningTable.inverseJoiningColumn.columnName,
						onDelete: relation.joiningTable.inverseJoiningColumn.onDelete,
					}
				}

				return [
					formatRelationFactory('manyHasMany', relation),
					...formatOrderBy(relation.orderBy),
					Object.keys(joiningTable).length > 0 ? `joiningTable(${printJsValue(joiningTable)})` : undefined,
					formatDeprecationReason(relation.deprecationReason),
				]
			},
			visitManyHasManyInverse: ({ relation }) => {
				return [
					formatRelationFactory('manyHasManyInverse', relation),
					...formatOrderBy(relation.orderBy),
					formatDeprecationReason(relation.deprecationReason),
				]
			},
		})
		const definitionCode = definition.filter(it => !!it).join('.')
		if (field.name === 'id' && definitionCode === 'uuidColumn().notNull()') {
			return undefined
		}
		return `\t${this.formatIdentifier(field.name)} = c.${definitionCode}`
	}

	private generateColumn({ entity, column }: { entity: Model.Entity; column: Model.AnyColumn }): string[] {
		let parts: string[] = []
		if (column.type === Model.ColumnType.Enum) {
			parts.push(`enumColumn(${column.columnType})`)
		} else {
			parts.push(`${ColumnToMethodMapping[column.type]}()`)
			const defaultColumnType = resolveDefaultColumnType(column.type)
			if (defaultColumnType !== column.columnType) {
				parts.push(`columnType(${printJsValue(column.columnType)})`)
			}
		}
		const defaultColumnName = this.schemaNamingConventions.getColumnName(column.name)
		if (defaultColumnName !== column.columnName) {
			parts.push(`columnName(${printJsValue(column.columnName)})`)
		}
		if (!column.nullable) {
			parts.push('notNull()')
		}
		if (column.default !== undefined) {
			parts.push(`default(${printJsValue(column.default)})`)
		}
		if (column.typeAlias) {
			parts.push(`typeAlias(${printJsValue(column.typeAlias)})`)
		}
		if (column.deprecationReason) {
			parts.push(`deprecated(${printJsValue(column.deprecationReason)})`)
		}


		// todo: sequence
		// todo: maybe single column unique()

		return parts
	}

	private formatIdentifier(id: string): string {
		return this.definitionNamingConventions.formatIdentifier(id)
	}
}


const ColumnToMethodMapping: {
	[K in Exclude<Model.ColumnType, Model.ColumnType.Enum>]: string
} = {
	[Model.ColumnType.Bool]: 'boolColumn',
	[Model.ColumnType.Date]: 'dateColumn',
	[Model.ColumnType.DateTime]: 'dateTimeColumn',
	[Model.ColumnType.Time]: 'timeColumn',
	[Model.ColumnType.Json]: 'jsonColumn',
	[Model.ColumnType.Double]: 'doubleColumn',
	[Model.ColumnType.Uuid]: 'uuidColumn',
	[Model.ColumnType.Int]: 'intColumn',
	[Model.ColumnType.String]: 'stringColumn',
}
