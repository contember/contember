import { Model } from '@contember/schema'
import { expect, test } from 'bun:test'
import { createSchema, c } from '../../../src'
import { extendEntity, FieldDefinition } from '../../../src/model/definition'
import { DecoratorFunction } from '../../../src/utils'

namespace ExtendedModel {
	export class Article {
		title = c.stringColumn()
	}

	const addField = (name: string, field: FieldDefinition<any>): DecoratorFunction<any> => {
		return extendEntity(({ entity, ...context }) => ({
			...entity,
			fields: {
				...entity.fields,
				[name]: field.createField({
					name,
					entityName: entity.name,
					...context,
				}),
			},
		}))
	}

	addField('lead', c.stringColumn())(Article)
}


test('add a field to entity using an extension', () => {
	const schema = createSchema(ExtendedModel)

	expect(schema.model.entities.Article.fields.lead).toStrictEqual({
		columnName: 'lead',
		name: 'lead',
		columnType: 'text',
		type: Model.ColumnType.String,
		nullable: true,
	})
})
