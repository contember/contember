import { describe, expect, test } from 'bun:test'
import { JSONValue, Model } from '@contember/schema'
import { c, createSchema } from '@contember/schema-definition'
import { Migration, ModificationHandlerFactory, SchemaDiffer, SchemaMigrator, validateAddedSql } from '../../../src/index.js'
import { testGenerateSql } from '../../src/tests.js'

namespace LogSchema {
	export class Log {
		message = c.stringColumn()
	}
}

namespace LogWithMeta {
	export class Log {
		message = c.stringColumn()
		meta = c.jsonColumn().notNull().default({})
	}
}

namespace LogWithObjectTitle {
	export class Log {
		message = c.stringColumn().default({ a: 1 })
	}
}

const logSchema = createSchema(LogSchema)

const createColumn = (columnType: string, type: Model.ColumnType, fillValue: JSONValue): Migration.Modification[] => [{
	modification: 'createColumn',
	entityName: 'Log',
	field: { name: 'meta', columnName: 'meta', type, columnType, nullable: false },
	fillValue,
}]

describe('fill value of a json column', () => {
	test.each<[string, string, JSONValue, string]>([
		['an empty object', 'jsonb', {}, '$pga${}$pga$::jsonb'],
		['an object', 'jsonb', { a: [1, 'x$pga$'] }, '$pgb${"a":[1,"x$pga$"]}$pgb$::jsonb'],
		['an array', 'jsonb', [1, { b: null }], '$pga$[1,{"b":null}]$pga$::jsonb'],
		['an object in a json column', 'json', { a: 1 }, '$pga${"a":1}$pga$::json'],
	])('%s is a JSON literal', (_, columnType, fillValue, sql) => {
		testGenerateSql(
			logSchema,
			createColumn(columnType, Model.ColumnType.Json, fillValue),
			`ALTER TABLE "log" ADD "meta" ${columnType}; UPDATE "log" SET "meta" = ${sql}; SET CONSTRAINTS ALL IMMEDIATE; SET CONSTRAINTS ALL DEFERRED; ALTER TABLE "log" ALTER "meta" SET NOT NULL;`,
		)
	})

	test('a raw SQL literal stays raw SQL', () => {
		testGenerateSql(
			logSchema,
			createColumn('jsonb', Model.ColumnType.Json, { literal: true, value: "'[]'::jsonb" }),
			`ALTER TABLE "log" ADD "meta" jsonb; UPDATE "log" SET "meta" = '[]'::jsonb; SET CONSTRAINTS ALL IMMEDIATE; SET CONSTRAINTS ALL DEFERRED; ALTER TABLE "log" ALTER "meta" SET NOT NULL;`,
		)
	})

	test('an object for a column that is not json is rejected', () => {
		expect(() => testGenerateSql(logSchema, createColumn('text', Model.ColumnType.String, {}), '')).toThrow('Cannot escape an object')
	})

	test('a non-null json column with default {} fills existing rows', () => {
		const differ = new SchemaDiffer(new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)))
		const updated = createSchema(LogWithMeta)
		expect(validateAddedSql(logSchema, updated)).toStrictEqual([])
		testGenerateSql(
			logSchema,
			differ.diffSchemas(logSchema, updated),
			'ALTER TABLE "log" ADD "meta" jsonb; ALTER TABLE "log" ALTER "meta" SET DATA TYPE jsonb USING $pga${}$pga$::jsonb, ALTER "meta" SET NOT NULL;',
		)
	})

	test('an object default on a column that is not json is a validation error', () => {
		expect(validateAddedSql(logSchema, createSchema(LogWithObjectTitle))).toStrictEqual([{
			code: 'MODEL_INVALID_COLUMN_DEFINITION',
			path: ['entities', 'Log', 'fields', 'message'],
			message: 'Column default cannot be emitted as SQL: Cannot escape an object as an SQL value.',
		}])
	})
})
