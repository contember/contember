import { expect, test } from 'bun:test'
import { Model } from '@contember/schema'
import { getColumnSqlType } from '../../../src/modifications/utils/columnUtils.js'

test('an enum name is quoted as one identifier, even when it contains a quote', () => {
	expect(getColumnSqlType({ type: Model.ColumnType.Enum, columnType: 'postStatus', list: true })).toBe('"postStatus"[]')
	// passes the column type pattern; without escaping, the first quote would end the identifier and start a second statement
	expect(getColumnSqlType({ type: Model.ColumnType.Enum, columnType: 'myenum"; DROP TABLE other_schema.t; --"' }))
		.toBe('"myenum""; DROP TABLE other_schema.t; --"""')
})

test('a non-enum column type is used as written', () => {
	expect(getColumnSqlType({ type: Model.ColumnType.String, columnType: 'VARCHAR(255) COLLATE "de_DE"' })).toBe('VARCHAR(255) COLLATE "de_DE"')
})
