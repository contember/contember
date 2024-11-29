import { ContentQueryBuilder, SchemaEntityNames, SchemaNames } from '@contember/client-content'
import { Schema, SchemaRelation } from '../schema'

export const createQueryBuilder = (schema: Schema) => {
	const schemaNames: SchemaNames = {
		entities: Object.fromEntries(schema.getEntityNames().map((it): [string, SchemaEntityNames<string>] => {
			const entity = schema.getEntity(it)
			return [it, {
				name: it,
				scalars: Array.from(entity.fields.values()).filter(it => it.__typename === '_Column').map(it => it.name),
				fields: Object.fromEntries(Array.from(entity.fields.values()).map(it => {
					if (it.__typename === '_Column') {
						return [it.name, { type: 'column' }]
					}
					if (it.__typename === '_Relation') {
						return [
							it.name,
							{
								type: it.type === 'ManyHasMany' || it.type === 'OneHasMany' ? 'many' : 'one',
								entity: (it as SchemaRelation).targetEntity,
							},
						]
					}
					throw new Error()
				})),
			}]
		})),
		enums: Object.fromEntries(schema.getEntityNames().map(it => [it, schema.getEnumValues(it)])),
	}

	return new ContentQueryBuilder(schemaNames)
}
