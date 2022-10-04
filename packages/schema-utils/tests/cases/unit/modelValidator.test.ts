import { assert, test } from 'vitest'
import { Model } from '@contember/schema'
import { ModelValidator } from '../../../src'


const model: Model.Schema = {
	enums: {},
	entities: {
		Foo: {
			fields: {
				id: {
					columnName: 'id',
					name: 'id',
					nullable: false,
					type: Model.ColumnType.Uuid,
					columnType: 'uuid',
				},
			},
			name: 'Foo',
			primary: 'id',
			primaryColumn: 'id',
			tableName: 'foo',
			unique: {},
			eventLog: {
				enabled: true,
			},
			indexes: {
				test: { fields: ['id'], name: 'test' },
			},
		},
		Bar: {
			fields: {
				id: {
					columnName: 'id',
					name: 'id',
					nullable: false,
					type: Model.ColumnType.Uuid,
					columnType: 'uuid',
				},
			},
			name: 'Bar',
			primary: 'id',
			primaryColumn: 'id',
			tableName: 'bar',
			unique: {
				test: { fields: ['id'], name: 'test' },
			},
			eventLog: {
				enabled: true,
			},
			indexes: {
				foo: { fields: ['id'], name: 'foo' },
			},
		},
	},
}
test('index name collision', () => {
	const validator = new ModelValidator(model)
	assert.deepStrictEqual(validator.validate(), [
		{
			message: 'index name foo of entity Bar collides with table name foo of entity Foo',
			path: ['entities', 'Bar'],
		},
		{
			message: 'unique index name test of entity Bar collides with index name test of entity Foo',
			path: ['entities', 'Bar'],
		},
	])
})
