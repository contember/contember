import { describe, expect, test } from 'bun:test'
import { JSONValue, Model } from '@contember/schema'
import { c, createSchema } from '@contember/schema-definition'
import { Migration, ModificationHandlerFactory, SchemaDiffer, SchemaMigrator, validateAddedSql } from '../../../src/index.js'
import { testGenerateSql } from '../../src/tests.js'

// A `{ literal: true, value }` default or fill value goes into the SQL unescaped, so its value must not end the statement.
namespace ArticleSchema {
	export class Article {
		title = c.stringColumn()
	}
}

const articleSchema = createSchema(ArticleSchema)

const createColumn = (fillValue: JSONValue): Migration.Modification[] => [{
	modification: 'createColumn',
	entityName: 'Article',
	field: { name: 'value', columnName: 'value', type: Model.ColumnType.String, columnType: 'text', nullable: true },
	fillValue,
}]

const fillTitle = (fillValue: JSONValue, valueMigrationStrategy?: 'using'): Migration.Modification[] => [{
	modification: 'updateColumnDefinition',
	entityName: 'Article',
	fieldName: 'title',
	definition: { type: Model.ColumnType.String, columnType: 'text', nullable: false },
	fillValue,
	...(valueMigrationStrategy ? { valueMigrationStrategy } : {}),
}]

describe('fill value', () => {
	test('a literal that ends the statement is rejected', () => {
		expect(() => testGenerateSql(articleSchema, createColumn({ literal: true, value: 'now(); DROP TABLE "article"; --' }), ''))
			.toThrow('Invalid fill value for Article: raw SQL literal must not contain ";"')
	})

	test('a literal inside an array is checked', () => {
		expect(() => testGenerateSql(articleSchema, createColumn([{ literal: true, value: '1]; DROP TABLE "article"; --' }]), ''))
			.toThrow('raw SQL literal must not contain ";"')
	})

	test('a literal ending in a line comment cannot drop the WHERE of the fill', () => {
		expect(() => testGenerateSql(articleSchema, fillTitle({ literal: true, value: "'x' --" }), ''))
			.toThrow('Invalid fill value for Article: raw SQL literal must not end with a line comment')
	})

	test('an unterminated string in a literal is rejected', () => {
		expect(() => testGenerateSql(articleSchema, fillTitle({ literal: true, value: "'x" }, 'using'), ''))
			.toThrow('Invalid fill value for Article: raw SQL literal contains an unterminated string literal')
	})

	test.each<[string, JSONValue, string]>([
		['a number', 42, '42'],
		['a string with a semicolon', 'a; b', '$pga$a; b$pga$'],
		['a boolean', true, 'true'],
		['now()', { literal: true, value: 'now()' }, 'now()'],
		['CURRENT_TIMESTAMP', { literal: true, value: 'CURRENT_TIMESTAMP' }, 'CURRENT_TIMESTAMP'],
		['gen_random_uuid()', { literal: true, value: 'gen_random_uuid()' }, 'gen_random_uuid()'],
		['a cast string literal', { literal: true, value: "'draft'::text" }, "'draft'::text"],
		['a quoted semicolon', { literal: true, value: "';'" }, "';'"],
		['a numeric literal', { literal: true, value: 3 }, '3'],
		['an array of literals', [{ literal: true, value: 'now()' }, { literal: true, value: "'x'" }], "ARRAY[now(),'x']"],
	])('%s generates the same SQL as before', (_, fillValue, sql) => {
		testGenerateSql(
			articleSchema,
			createColumn(fillValue),
			`ALTER TABLE "article" ADD "value" text; UPDATE "article" SET "value" = ${sql}; SET CONSTRAINTS ALL IMMEDIATE; SET CONSTRAINTS ALL DEFERRED;`,
		)
	})

	test('a valid literal with the using strategy generates the same SQL as before', () => {
		testGenerateSql(
			articleSchema,
			fillTitle({ literal: true, value: "'untitled'" }, 'using'),
			`ALTER TABLE "article" ALTER "title" SET DATA TYPE text USING COALESCE("title"::text, 'untitled'), ALTER "title" SET NOT NULL;`,
		)
	})
})

namespace InjectedDefault {
	export class Article {
		title = c.stringColumn()
		publishedAt = c.dateTimeColumn().default({ literal: true, value: 'now(); DELETE FROM "article"; --' })
	}
}

namespace NowDefault {
	export class Article {
		title = c.stringColumn()
		publishedAt = c.dateTimeColumn().default({ literal: true, value: 'now()' })
	}
}

namespace InjectedTitleDefault {
	export class Article {
		title = c.stringColumn().default({ literal: true, value: '\'x\'); DELETE FROM "article"; --' })
	}
}

describe('column default', () => {
	const injected = createSchema(InjectedDefault)

	test('a new column with a literal default that ends the statement is rejected', () => {
		expect(validateAddedSql(articleSchema, injected)).toStrictEqual([{
			code: 'MODEL_INVALID_COLUMN_DEFINITION',
			path: ['entities', 'Article', 'fields', 'publishedAt'],
			message: 'Column default raw SQL literal must not contain ";".',
		}])
	})

	test('a changed default is checked again, an unchanged one is not', () => {
		expect(validateAddedSql(articleSchema, createSchema(InjectedTitleDefault)).map(it => it.code)).toStrictEqual(['MODEL_INVALID_COLUMN_DEFINITION'])
		expect(validateAddedSql(injected, injected)).toStrictEqual([])
	})

	test('a plain literal default passes', () => {
		expect(validateAddedSql(articleSchema, createSchema(NowDefault))).toStrictEqual([])
	})

	test('the differ refuses to generate a migration for a literal default that ends the statement', () => {
		const differ = new SchemaDiffer(new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)))
		expect(() => differ.diffSchemas(articleSchema, injected)).toThrow('updated schema contains invalid SQL')
		const [modification] = differ.diffSchemas(articleSchema, createSchema(NowDefault))
		testGenerateSql(
			articleSchema,
			[modification],
			'ALTER TABLE "article" ADD "published_at" timestamptz; ALTER TABLE "article" ALTER "published_at" SET DATA TYPE timestamptz USING now();',
		)
	})
})
