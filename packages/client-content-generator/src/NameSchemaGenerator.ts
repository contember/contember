import { SchemaEntityNames, SchemaNames } from '@contember/client-content'
import { Model } from '@contember/schema'
import { acceptEveryFieldVisitor } from '@contember/schema-utils'
import { GenerateOptions, isColumnExcluded, isEntityExcluded, isRelationExcluded } from './utils.js'

export class NameSchemaGenerator {
	generate(model: Model.Schema, options?: GenerateOptions): SchemaNames {
		return {
			entities: Object.fromEntries(
				Object.values(model.entities).filter(entity => !isEntityExcluded(entity, options)).map(entity => {
					const fields: Record<string, SchemaEntityNames<any>['fields'][string]> = {}
					const scalars: string[] = []

					acceptEveryFieldVisitor(model, entity, {
						visitHasOne: ctx => {
							if (isRelationExcluded(ctx.relation, ctx.targetEntity, options)) {
								return
							}
							fields[ctx.relation.name] = {
								type: 'one',
								entity: ctx.targetEntity.name,
							}
						},
						visitHasMany: ctx => {
							if (isRelationExcluded(ctx.relation, ctx.targetEntity, options)) {
								return
							}
							fields[ctx.relation.name] = {
								type: 'many',
								entity: ctx.targetEntity.name,
							}
						},
						visitColumn: ctx => {
							if (isColumnExcluded(ctx.column, options)) {
								return
							}
							scalars.push(ctx.column.name)
							fields[ctx.column.name] = {
								type: 'column',
							}
						},
					})

					return [entity.name, { name: entity.name, fields, scalars }]
				}),
			),
			enums: Object.fromEntries(
				Object.entries(model.enums).map(([name, enumType]) => [name, enumType]),
			),
		}
	}
}
