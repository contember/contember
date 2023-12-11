import { Model } from '@contember/schema'
import { acceptEveryFieldVisitor, acceptFieldVisitor } from '@contember/schema-utils'

export class EntityTypeSchemaGenerator {
	generate(model: Model.Schema): string {
		let code = ''
		for (const enumName of Object.keys(model.enums)) {
			code += `import type { ${enumName} } from './enums'\n`
		}

		code += `
export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export type JSONObject = { readonly [K in string]?: JSONValue }
export type JSONArray = readonly JSONValue[]

`

		for (const entity of Object.values(model.entities)) {
			code += this.generateTypeEntityCode(model, entity)
		}
		code += '\n'
		code += `export type ContemberClientEntities = {\n`
		for (const entity of Object.values(model.entities)) {
			code += `\t${entity.name}: ${entity.name}\n`
		}
		code += '}\n\n'
		code += `export type ContemberClientSchema = {\n`
		code += '\tentities: ContemberClientEntities\n'
		code += '}\n'
		return code
	}

	private generateTypeEntityCode(model: Model.Schema, entity: Model.Entity): string {
		let code = `export type ${entity.name} = {\n`
		code += '\tname: \'' + entity.name + '\'\n'
		code += '\tunique:\n'
		code += this.formatUniqueFields(model, entity)
		let columnsCode = ''
		let hasOneCode = ''
		let hasManyCode = ''
		acceptEveryFieldVisitor(model, entity, {
			visitHasMany: ctx => {
				hasManyCode += `\t\t${ctx.relation.name}: ${ctx.targetEntity.name}\n`
			},
			visitHasOne: ctx => {
				hasOneCode += `\t\t${ctx.relation.name}: ${ctx.targetEntity.name}\n`
			},
			visitColumn: ctx => {
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
		code += this.formatReducedFields(model, entity)
		code += '\t}\n'
		code += '}\n'
		return code
	}

	private formatReducedFields(model: Model.Schema, entity: Model.Entity): string {
		let code = ''
		acceptEveryFieldVisitor(model, entity, {
			visitOneHasMany: ({ entity, relation, targetEntity, targetRelation }) => {
				if (!targetRelation) {
					return
				}
				const uniqueConstraints = getFieldsForUniqueWhere(model, targetEntity)
				const composedUnique = uniqueConstraints
					.filter(fields => fields.length === 2) //todo support all uniques
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

	private formatUniqueFields(model: Model.Schema, entity: Model.Entity): string {
		const fields = getFieldsForUniqueWhere(model, entity)
		let code = ''
		for (const field of fields) {
			code += '\t\t| { '
			code += field.map(it => `${it}: ${uniqueType(model, entity, entity.fields[it])}`).join(', ')
			code += ' }\n'
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
	switch (column.type) {
		case Model.ColumnType.Enum:
			return column.columnType
		case Model.ColumnType.String:
			return 'string'
		case Model.ColumnType.Int:
			return 'number'
		case Model.ColumnType.Double:
			return 'number'
		case Model.ColumnType.Bool:
			return 'boolean'
		case Model.ColumnType.DateTime:
			return 'string'
		case Model.ColumnType.Date:
			return 'string'
		case Model.ColumnType.Json:
			return 'JSONValue'
		case Model.ColumnType.Uuid:
			return 'string'
		default:
			((_: never) => {
				throw new Error(`Unknown type ${_}`)
			})(column.type)
	}
}

const getFieldsForUniqueWhere = (schema: Model.Schema, entity: Model.Entity): readonly (readonly string[])[] => {
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
}
