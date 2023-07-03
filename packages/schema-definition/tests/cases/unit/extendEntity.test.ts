import { Model } from '@contember/schema'
import { assert, test } from 'vitest'
import { createSchema, c } from '../../../src'
import { extendEntity, FieldDefinition } from '../../../src/model/definition'
import { DecoratorFunction } from '../../../src/utils'

namespace ExtendedModel {
	export class Article {
		title = c.stringColumn()
	}

	const addField = (name: string, field: FieldDefinition<any>): DecoratorFunction<any> => {
		return extendEntity(({ entity, conventions, entityRegistry, enumRegistry }) => ({
			...entity,
			fields: {
				...entity.fields,
				[name]: field.createField({
					name,
					enumRegistry,
					entityRegistry,
					conventions,
					entityName: entity.name,
				}),
			},
		}))
	}

	addField('lead', c.stringColumn())(Article)
}


test('add a field to entity using an extension', () => {
	const schema = createSchema(ExtendedModel)

	assert.deepEqual(schema.model.entities.Article.fields.lead, {
		columnName: 'lead',
		name: 'lead',
		columnType: 'text',
		type: Model.ColumnType.String,
		nullable: true,
	})
})
