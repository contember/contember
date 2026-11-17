import { Model } from '@contember/schema'
import { acceptEveryFieldVisitor, acceptFieldVisitor, jsonSchemaToTsType } from '@contember/schema-utils'

import { formatDocComment, GenerateOptions, getEnumTypeName, isColumnExcluded, isEntityExcluded, isRelationExcluded } from './utils.js'

export class EntityTypeSchemaGenerator {
	generate(model: Model.Schema, options?: GenerateOptions): string {
		let code = ''
		for (const enumName of Object.keys(model.enums)) {
			code += `import type { ${getEnumTypeName(enumName)} } from './enums'\n`
		}

		code += `
export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export type JSONObject = { readonly [K in string]?: JSONValue }
export type JSONArray = readonly JSONValue[]

`

		const entities = Object.values(model.entities).filter(entity => !isEntityExcluded(entity, options))
		for (const entity of entities) {
			code += this.generateTypeEntityCode(model, entity, options)
		}
		code += '\n'
		code += `export type ContemberClientEntities = {\n`
		for (const entity of entities) {
			code += formatDocComment('\t', { deprecationReason: entity.deprecationReason })
			code += `\t${entity.name}: ${entity.name}\n`
		}
		code += '}\n\n'
		code += `export type ContemberClientSchema = {\n`
		code += '\tentities: ContemberClientEntities\n'
		code += '}\n'
		return code
	}

	private generateTypeEntityCode(model: Model.Schema, entity: Model.Entity, options?: GenerateOptions): string {
		let code = formatDocComment('', entity)
		code += `export type ${entity.name} <OverRelation extends string | never = never> = {\n`
		code += "\tname: '" + entity.name + "'\n"
		code += '\tunique:\n'
		code += this.formatUniqueFields(model, entity, options)
		let columnsCode = ''
		let hasOneCode = ''
		let hasManyCode = ''
		acceptEveryFieldVisitor(model, entity, {
			visitHasMany: ctx => {
				if (isRelationExcluded(ctx.relation, ctx.targetEntity, options)) {
					return
				}
				hasManyCode += formatDocComment('\t\t', ctx.relation)
				hasManyCode += `\t\t${ctx.relation.name}: ${ctx.targetEntity.name}${
					ctx.targetRelation?.type === Model.RelationType.ManyHasOne ? `<'${ctx.targetRelation.name}'>` : ''
				}\n`
			},
			visitHasOne: ctx => {
				if (isRelationExcluded(ctx.relation, ctx.targetEntity, options)) {
					return
				}
				hasOneCode += formatDocComment('\t\t', ctx.relation)
				hasOneCode += `\t\t${ctx.relation.name}: ${ctx.targetEntity.name}\n`
			},
			visitColumn: ctx => {
				if (isColumnExcluded(ctx.column, options)) {
					return
				}
				columnsCode += formatDocComment('\t\t', ctx.column)
				columnsCode += `\t\t${ctx.column.name}: ${columnToTsType(ctx.column)}${ctx.column.nullable ? ` | null` : ''}\n`
			},
		})

		code += '\tcolumns: {\n'
		code += columnsCode
		code += '\t}\n'
		code += '\thasOne: {\n'
		code += hasOneCode
		code += '\t}\n'
		code += '\thasMany: {\n'
		code += hasManyCode
		code += '\t}\n'
		code += '\thasManyBy: {\n'
		code += this.formatReducedFields(model, entity, options)
		code += '\t}\n'
		code += '}\n'
		return code
	}

	private formatReducedFields(model: Model.Schema, entity: Model.Entity, options?: GenerateOptions): string {
		let code = ''
		acceptEveryFieldVisitor(model, entity, {
			visitOneHasMany: ({ entity, relation, targetEntity, targetRelation }) => {
				if (!targetRelation || isRelationExcluded(relation, targetEntity, options) || isRelationExcluded(targetRelation, entity, options)) {
					return
				}
				const uniqueConstraints = getFieldsForUniqueWhere(model, targetEntity, options)
				const composedUnique = uniqueConstraints
					.filter(fields => fields.length === 2) // todo support all uniques
					.filter(fields => fields.includes(targetRelation.name))
					.map(fields => fields.filter(it => it !== targetRelation.name))
					.map(fields => fields[0])
				const singleUnique = uniqueConstraints
					.filter(fields => fields.length === 1 && fields[0] !== targetEntity.primary)
					.map(fields => fields[0])
					.filter(it => it !== targetRelation.name)
				;[...composedUnique, ...singleUnique].forEach(fieldName => {
					const capitalizeFirstLetter = (value: string) => {
						return value.charAt(0).toUpperCase() + value.slice(1)
					}
					const name = `${relation.name}By${capitalizeFirstLetter(fieldName)}`

					const targetUnique = targetEntity.fields[fieldName]

					code += formatDocComment('\t\t', { deprecationReason: relation.deprecationReason })
					code += `\t\t${name}: { entity: ${targetEntity.name}; by: {${fieldName}: ${uniqueType(model, targetEntity, targetUnique)}}  }\n`
				})
			},
			visitColumn: () => {
			},
			visitManyHasManyInverse: () => {
			},
			visitManyHasManyOwning: () => {
			},
			visitManyHasOne: () => {
			},
			visitOneHasOneInverse: () => {
			},
			visitOneHasOneOwning: () => {
			},
		})
		return code
	}

	private formatUniqueFields(model: Model.Schema, entity: Model.Entity, options?: GenerateOptions): string {
		const fields = getFieldsForUniqueWhere(model, entity, options)
		let code = ''
		for (const field of fields) {
			code += '\t\t| Omit<{ '
			code += field.map(it => `${it}: ${uniqueType(model, entity, entity.fields[it])}`).join('; ')
			code += '}, OverRelation>\n'
		}
		return code
	}
}

const uniqueType = (model: Model.Schema, entity: Model.Entity, field: Model.AnyField): string => {
	return acceptFieldVisitor(model, entity, field, {
		visitColumn: ctx => {
			return columnToTsType(ctx.column)
		},
		visitRelation: ctx => {
			return ctx.targetEntity.name + `['unique']`
		},
	})
}

const columnToTsType = (column: Model.AnyColumn): string => {
	const baseType = (() => {
		switch (column.type) {
			case Model.ColumnType.Enum:
				return getEnumTypeName(column.columnType)
			case Model.ColumnType.String:
				return 'string'
			case Model.ColumnType.Int:
				return 'number'
			case Model.ColumnType.Double:
				return 'number'
			case Model.ColumnType.Numeric:
				return 'string'
			case Model.ColumnType.Bool:
				return 'boolean'
			case Model.ColumnType.DateTime:
				return 'string'
			case Model.ColumnType.Time:
				return 'string'
			case Model.ColumnType.Date:
				return 'string'
			case Model.ColumnType.Json:
				// A jsonColumn with an attached JSON Schema gets a derived TypeScript type; without a
				// schema (or for any construct the schema cannot faithfully express) it stays `JSONValue`.
				return column.schema !== undefined ? jsonSchemaToTsType(column.schema) : 'JSONValue'
			case Model.ColumnType.Uuid:
				return 'string'
			default:
				;((_: never) => {
					throw new Error(`Unknown type ${_}`)
				})(column.type)
		}
	})()
	return column.list ? `readonly ${baseType}[]` : baseType
}

const getFieldsForUniqueWhere = (schema: Model.Schema, entity: Model.Entity, options?: GenerateOptions): readonly (readonly string[])[] => {
	const excludedFields = new Set(
		Object.values(entity.fields)
			.filter(field =>
				acceptFieldVisitor(schema, entity, field, {
					visitColumn: ({ column }) => isColumnExcluded(column, options),
					visitRelation: ({ relation, targetEntity }) => isRelationExcluded(relation, targetEntity, options),
				})
			)
			.map(field => field.name),
	)
	const relations = Object.values(
		acceptEveryFieldVisitor<undefined | [string]>(schema, entity, {
			visitColumn: () => undefined,
			visitManyHasManyInverse: () => undefined,
			visitManyHasManyOwning: () => undefined,
			visitOneHasMany: ({ relation }) => [relation.name],
			visitManyHasOne: () => undefined,
			visitOneHasOneInverse: ({ relation }) => [relation.name],
			visitOneHasOneOwning: ({ relation }) => [relation.name],
		}),
	).filter((it): it is [string] => !!it)

	return [[entity.primary], ...Object.values(entity.unique).map(it => it.fields), ...relations]
		.filter(fields => fields.every(field => !excludedFields.has(field)))
}
