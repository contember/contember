import { assert, test } from 'vitest'
import { Model } from '@contember/schema'
import { ModelValidator } from '../../../src'



test('index name collision', () => {
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
	const validator = new ModelValidator(model)
	assert.deepStrictEqual(validator.validate(), [
		{
			code: 'MODEL_NAME_COLLISION',
			message: 'index name foo of entity Bar collides with table name foo of entity Foo',
			path: ['entities', 'Bar'],
		},
		{
			code: 'MODEL_NAME_COLLISION',
			message: 'unique index name test of entity Bar collides with index name test of entity Foo',
			path: ['entities', 'Bar'],
		},
	])
})


test('"meta" collision', () => {
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
				eventLog: { enabled: true },
				indexes: {},
			},
			FooMeta: {
				fields: {
					id: {
						columnName: 'id',
						name: 'id',
						nullable: false,
						type: Model.ColumnType.Uuid,
						columnType: 'uuid',
					},
				},
				name: 'FooMeta',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'foo_meta',
				unique: {},
				eventLog: { enabled: true },
				indexes: {},
			},
			BarMeta: {
				fields: {
					id: {
						columnName: 'id',
						name: 'id',
						nullable: false,
						type: Model.ColumnType.Uuid,
						columnType: 'uuid',
					},
				},
				name: 'BarMeta',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'bar',
				unique: {},
				eventLog: { enabled: true },
				indexes: {},
			},
		},
	}
	const validator = new ModelValidator(model)
	assert.deepStrictEqual(validator.validate(), [
		{
			code: 'MODEL_NAME_COLLISION',
			message: 'entity FooMeta collides with entity Foo, because a GraphQL type with "Meta" suffix is created for every entity',
			path: ['entities', 'FooMeta'],
		},
	])
})
