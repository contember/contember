import { SchemaNames, SchemaEntityNames } from '@contember/client-content'
import { Model } from '@contember/schema'
import { acceptEveryFieldVisitor } from '@contember/schema-utils'

export class NameSchemaGenerator {
	generate(model: Model.Schema): SchemaNames {
		return {
			entities: Object.fromEntries(
				Object.values(model.entities).map(entity => {
					const fields: Record<string, SchemaEntityNames<any>['fields'][string]> = {}
					const scalars: string[] = []

					acceptEveryFieldVisitor(model, entity, {
						visitHasOne: ctx => {
							fields[ctx.relation.name] = {
								type: 'one',
								entity: ctx.targetEntity.name,
							}
						},
						visitHasMany: ctx => {
							fields[ctx.relation.name] = {
								type: 'many',
								entity: ctx.targetEntity.name,
							}
						},
						visitColumn: ctx => {
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


