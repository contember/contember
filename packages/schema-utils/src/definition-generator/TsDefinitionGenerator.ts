import { Acl, Model, Schema, Writable } from '@contember/schema'
import {
	acceptFieldVisitor,
	DefaultNamingConventions,
	isInverseRelation,
	NamingConventions,
	NamingHelper,
	resolveDefaultColumnType,
} from '../model'
import { PredicateDefinitionProcessor } from '../acl'
import { Literal, printJsValue } from '../utils/printJsValue'


export class TsDefinitionGenerator {
	private static reservedWords = new Set(['do', 'if', 'in', 'for', 'let', 'new', 'try', 'var', 'case', 'else', 'enum', 'eval', 'null', 'this', 'true', 'void', 'with', 'await', 'break', 'catch', 'class', 'const', 'false', 'super', 'throw', 'while', 'yield', 'delete', 'export', 'import', 'public', 'return', 'static', 'switch', 'typeof', 'default', 'extends', 'finally', 'package', 'private', 'continue', 'debugger', 'function', 'arguments', 'interface', 'protected', 'implements', 'instanceof'])

	constructor(
		private readonly schema: Schema,
		private readonly conventions: NamingConventions = new DefaultNamingConventions(),
	) {
	}

	public generate() {
		const roles = Object.entries(this.schema.acl.roles).map(([name, values]) => this.generateRole({ name, values })).join('')
		const aclVariables = this.generateAclVariables().join('')
		const enums = Object.entries(this.schema.model.enums).map(([name, values]) => this.generateEnum({
			name,
			values,
		})).join('')
		const entities = Object.values(this.schema.model.entities).map(entity => this.generateEntity({ entity })).join('')
		return `import { SchemaDefinition as def, AclDefinition as acl } from '@contember/schema-definition'
${roles}${aclVariables}${enums}${entities}`
	}

	private generateRole({ name, values }: { name: string; values: Acl.RolePermissions }): string {
		const { variables, entities, inherits, ...other } = values
		return `\nexport const ${this.roleVarName(name)} = acl.createRole(${printJsValue(name)}, ${printJsValue(other)})\n`
	}

	private generateAclVariables(): string[] {
		const variablesOutput: string[] = []

		Object.entries(this.schema.acl.roles).map(([roleName, roleValues]) => {
			Object.entries(roleValues.variables).map(([variableName, variableValues]) => {
				let variableDefinition = `\nexport const ${this.variableVarName(roleName, variableName)} = acl.`
				if (variableValues.type === Acl.VariableType.predefined) {
					variableDefinition += `createPredefinedVariable(${printJsValue(variableName)}, ${printJsValue(variableValues.value)}, ${this.roleVarName(roleName)})\n`
				} else if (variableValues.type === Acl.VariableType.entity) {
					variableDefinition += `createEntityVariable(${printJsValue(variableName)}, ${printJsValue(variableValues.entityName)}, ${this.roleVarName(roleName)})\n`
				} else {
					throw new Error(`Variable type ${variableValues.type} not yet supported`)
				}
				variablesOutput.push(variableDefinition)
			})
		})

		return variablesOutput
	}

	private generateEnum({ name, values }: { name: string; values: readonly string[] }): string {
		return `\nexport const ${this.formatIdentifier(name)} = def.createEnum(${values.map(it => printJsValue(it)).join(', ')})\n`
	}

	public generateEntity({ entity }: { entity: Model.Entity }): string {
		const decorators = [
			...Object.values(entity.unique).map(constraint => this.generateUniqueConstraint({ entity, constraint })),
			...Object.values(entity.indexes).map(index => this.generateIndex({ entity, index })),
			this.generateView({ entity }),
		].filter(it => !!it).map(it => `${it}\n`).join('')
		const acl = this.generateEntityAcl({ entity })

		return `\n${decorators}${acl}export class ${this.formatIdentifier(entity.name)} {
${Object.values(entity.fields).map(field => this.generateField({ field, entity })).filter(it => !!it).join('\n')}
}\n`
	}

	private generateUniqueConstraint({ entity, constraint }: { entity: Model.Entity; constraint: Model.UniqueConstraint }): string {
		const defaultName = NamingHelper.createUniqueConstraintName(entity.name, constraint.fields)
		if (defaultName === constraint.name) {
			const fieldsList = `${constraint.fields.map(it => printJsValue(it)).join(', ')}`
			return `@def.Unique(${fieldsList})`
		}
		return `@def.Unique(${printJsValue(constraint)})`
	}

	private generateIndex({ entity, index }: { entity: Model.Entity; index: Model.Index }): string {
		const defaultName = NamingHelper.createIndexName(entity.name, index.fields)
		if (defaultName === index.name) {
			const fieldsList = `${index.fields.map(it => printJsValue(it)).join(', ')}`
			return `@def.Index(${fieldsList})`
		}
		return `@def.Index(${printJsValue(index)})`
	}

	private generateEntityAcl({ entity }: { entity: Model.Entity }): string {
		const aclOutput: string[] = []
		const numberOfEntityFieldsWithoutId = Object.keys(entity.fields).length - 1
		for (const [roleName, roleDefinition] of Object.entries(this.schema.acl.roles)) {
			const entityPermission = roleDefinition.entities[entity.name]
			if (!entityPermission) {
				continue
			}
			for (const [predicateName, predicateDefinition] of Object.entries(entityPermission.predicates)) {
				const operations = this.getMatchingOperations({
					predicate: predicateName,
					operations: entityPermission.operations,
					numberOfEntityFieldsWithoutId,
				})
				if (Object.keys(operations).length > 0) {
					const processor = new PredicateDefinitionProcessor(this.schema.model)
					const when = processor.process(entity, predicateDefinition, {
						handleColumn: ctx => {
							if (typeof ctx.value === 'string' && ctx.value in roleDefinition.variables) {
								return new Literal(this.variableVarName(roleName, ctx.value))
							}
							return ctx.value
						},
						handleRelation: ctx => {
							return ctx.value
						},
					})
					aclOutput.push(`@acl.allow(${this.roleVarName(roleName)}, ${printJsValue({ when, ...operations }, (val, path) => path.length === 0)})\n`)
				}
			}
			const trueOperations = this.getMatchingOperations({
				predicate: true,
				operations: entityPermission.operations,
				numberOfEntityFieldsWithoutId,
			})
			if (Object.keys(trueOperations).length > 0) {
				aclOutput.push(`@acl.allow(${this.roleVarName(roleName)}, ${printJsValue({ ...trueOperations }, (val, path) => path.length === 0)})\n`)
			}
		}

		if (!aclOutput.length) {
			return ''
		}
		return `\n${aclOutput.join('')}`
	}

	private getMatchingOperations({ operations, predicate, numberOfEntityFieldsWithoutId }: {
		operations: Acl.EntityOperations
		predicate: Acl.Predicate
		numberOfEntityFieldsWithoutId: number
	}): { read?: string[] | true; create?: string[] | boolean; update?: string[] | boolean; delete?: true } {
		const result: ReturnType<TsDefinitionGenerator['getMatchingOperations']> = {}
		for (const op of ['read', 'create', 'update'] as const) {
			const fields = Object.entries(operations[op] ?? {}).filter(([, it]) => it === predicate).map(([it]) => it)
			if (fields.length === 0) {
				continue
			} else if (fields.length === numberOfEntityFieldsWithoutId) {
				result[op] = true
			} else {
				result[op] = fields
			}
		}
		if (operations.delete === predicate) {
			result.delete = true
		}

		return result
	}

	private generateView({ entity }: { entity: Model.Entity }): string | undefined {
		if (!entity.view) {
			return undefined
		}

		const dependenciesExpr = (entity.view.dependencies?.length ?? 0) > 0
			? `, {\n\tdependencies: () => [${entity.view.dependencies?.map(it => this.formatIdentifier(it))}]\n}`
			: ''

		return `@def.View(\`${entity.view.sql}\`${dependenciesExpr})`
	}

	public generateField({ entity, field }: { entity: Model.Entity; field: Model.AnyField }): string | undefined {
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
			const defaultJoiningColumn = this.conventions.getJoiningColumnName(fieldName)
			if (defaultJoiningColumn === joiningColumnName) {
				return undefined
			}
			return `joiningColumn(${printJsValue(joiningColumnName)})`
		}
		const definition = acceptFieldVisitor<(string | undefined)[]>(this.schema.model, entity, field, {
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
				]
			},
			visitOneHasOneInverse: ({ relation }) => {
				return [
					formatRelationFactory('oneHasOneInverse', relation),
					!relation.nullable ? 'notNull()' : undefined,
				]
			},
			visitOneHasOneOwning: ({ relation }) => {
				return [
					formatRelationFactory('oneHasOne', relation),
					!relation.nullable ? 'notNull()' : undefined,
					formatOnDelete(relation.joiningColumn.onDelete),
					formatJoiningColumn(relation.joiningColumn.columnName, relation.name),
					relation.orphanRemoval ? 'removeOrphan()' : undefined,
				]
			},
			visitManyHasManyOwning: ({ entity, relation }) => {
				const columnNames = this.conventions.getJoiningTableColumnNames(
					entity.name,
					relation.name,
					relation.target,
					relation.inversedBy,
				)
				const defaultJoiningTable = this.conventions.getJoiningTableName(entity.name, relation.name)
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
				]
			},
			visitManyHasManyInverse: ({ relation }) => {
				return [
					formatRelationFactory('manyHasManyInverse', relation),
					...formatOrderBy(relation.orderBy),
				]
			},
		})
		const definitionCode = definition.filter(it => !!it).join('.')
		if (field.name === 'id' && definitionCode === 'uuidColumn().notNull()') {
			return undefined
		}
		return `\t${this.formatIdentifier(field.name)} = def.${definitionCode}`
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
		const defaultColumnName = this.conventions.getColumnName(column.name)
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


		// todo: sequence
		// todo: maybe single column unique()

		return parts
	}

	private formatIdentifier(id: string): string {
		// todo: validate
		return id
	}


	private roleVarName(id: string): string {
		return this.formatIdentifier(`${id}Role`)
	}

	private variableVarName(role: string, id: string): string {
		return this.formatIdentifier(`${id}${role.charAt(0).toUpperCase() + role.slice(1)}Variable`)
	}
}


const ColumnToMethodMapping: {
	[K in Exclude<Model.ColumnType, Model.ColumnType.Enum>]: string
} = {
	[Model.ColumnType.Bool]: 'boolColumn',
	[Model.ColumnType.Date]: 'dateColumn',
	[Model.ColumnType.DateTime]: 'dateTimeColumn',
	[Model.ColumnType.Json]: 'jsonColumn',
	[Model.ColumnType.Double]: 'doubleColumn',
	[Model.ColumnType.Uuid]: 'uuidColumn',
	[Model.ColumnType.Int]: 'intColumn',
	[Model.ColumnType.String]: 'stringColumn',
}
