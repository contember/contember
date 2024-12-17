import { expect, describe, test } from 'bun:test'
import { modelSchema } from '../../../src/type-schema'
import { Model } from '@contember/schema'

describe('model schema', () => {
	const validDataTypes = [
		'integer',
		'double precision',
		'character varying(255)',
		'numeric(10, 2)',
		'timestamp(3) with time zone',
		'geometry(Point, 4326)',
		'character(10)[]',
		'bit varying(5)',
		'VARCHAR(255) COLLATE "de_DE"',
	]

	// Array of invalid PostgreSQL data type examples
	const invalidDataTypes = [
		'varchar(255',           // Missing closing parenthesis
		'character(10))',        // Extra closing parenthesis
		'numeric(,2)',           // Missing first parameter
		'geometry(Point,4326))', // Extra closing parenthesis
		'VARCHAR(255) COLLATE "de_DE" (extra text)', // Extra text outside the valid pattern
		'VARCHAR(255) COLLATE "de_DE', // Missing closing quote
	]

	for (const dataType of validDataTypes) {
		test(`accept valid data type ${dataType}`, () => {
			const column: Model.AnyColumn = {
				type: Model.ColumnType.String,
				columnName: 'column',
				name: 'column',
				columnType: dataType,
				nullable: false,
			}
			const model: Model.Schema = {
				entities: {
					Test: {
						tableName: 'test',
						primary: 'id',
						primaryColumn: 'id',
						unique: [],
						indexes: [],
						eventLog: { enabled: false },
						name: 'Test',
						fields: {
							column,
						},
					},
				},
				enums: {},
			}
			expect(modelSchema(model)).toStrictEqual(model)
		})
	}

	for (const dataType of invalidDataTypes) {
		test(`reject invalid data type ${dataType}`, () => {
			const column: Model.AnyColumn = {
				type: Model.ColumnType.String,
				columnName: 'column',
				name: 'column',
				columnType: dataType,
				nullable: false,
			}
			const model: Model.Schema = {
				entities: {
					Test: {
						tableName: 'test',
						primary: 'id',
						primaryColumn: 'id',
						unique: [],
						indexes: [],
						eventLog: { enabled: false },
						name: 'Test',
						fields: {
							column,
						},
					},
				},
				enums: {},
			}
			expect(() => modelSchema(model)).toThrow(`value at path /entities/Test/fields/column: all variants of union has failed:
            value at path /entities/Test/fields/column/columnType: must be valid column type, "${dataType.replaceAll('"', '\\"')}" given`)
		})
	}
})
