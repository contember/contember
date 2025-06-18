import { createSchema, c } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'
import { describe } from 'bun:test'
import { testMigrations } from '../../src/tests'

describe('add column alias', () => testMigrations({
	original: createSchema({
		Author: class Author {
			name = c.stringColumn()
		},
	}),
	updated: createSchema({
		Author: class Author {
			name = c.stringColumn().alias('authorName')
		},
	}),
	diff: [
		{
			modification: 'updateColumnDefinition',
			entityName: 'Author',
			fieldName: 'name',
			definition: {
				aliases: [
					'authorName',
				],
				columnType: 'text',
				nullable: true,
				type: Model.ColumnType.String,
			},
		},
	],
	sql: SQL``,
}))

describe('add column alias', () => testMigrations({
	original: createSchema({
		Author: class Author {
			enum = c.enumColumn(c.createEnum('a', 'b', 'c'))
		},
	}),
	updated: createSchema({
		Author: class Author {
			enum = c.enumColumn(c.createEnum('a', 'b', 'c')).alias('enumaration')
		},
	}),
	diff: [
		{
			modification: 'updateColumnDefinition',
			entityName: 'Author',
			fieldName: 'enum',
			definition: {
				aliases: [
					'enumaration',
				],
				columnType: 'AuthorEnum',
				nullable: true,
				type: Model.ColumnType.Enum,
			},
		},
	],
	sql: SQL``,
}))

describe('add column aliases', () => testMigrations({
	original: createSchema({
		Author: class Author {
			name = c.stringColumn()
		},
	}),
	updated: createSchema({
		Author: class Author {
			name = c.stringColumn().alias('authorName', 'authorName2')
		},
	}),
	diff: [
		{
			modification: 'updateColumnDefinition',
			entityName: 'Author',
			fieldName: 'name',
			definition: {
				aliases: [
					'authorName',
					'authorName2',
				],
				columnType: 'text',
				nullable: true,
				type: Model.ColumnType.String,
			},
		},
	],
	sql: SQL``,
}))

describe('remove column alias', () => testMigrations({
	original: createSchema({
		Author: class Author {
			name = c.stringColumn().alias('authorName')
		},
	}),
	updated: createSchema({
		Author: class Author {
			name = c.stringColumn()
		},
	}),
	diff: [
		{
			modification: 'updateColumnDefinition',
			entityName: 'Author',
			fieldName: 'name',
			definition: {
				columnType: 'text',
				nullable: true,
				type: Model.ColumnType.String,
			},
		},
	],
	sql: SQL``,
}))
