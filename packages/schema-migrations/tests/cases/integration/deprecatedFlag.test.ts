import { c, createSchema, SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'
import { describe } from 'bun:test'
import { testMigrations } from '../../src/tests'

describe('add deprecation flag to column', () => testMigrations({
	original: {
		model: new SchemaBuilder()
			.entity('Author', entity => entity.column('email', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('Author', entity =>
				entity.column('email', c => c.type(Model.ColumnType.String).deprecated('deprecated')))
			.buildSchema(),
	},
	diff: [
		{
			modification: 'updateColumnDefinition',
			entityName: 'Author',
			fieldName: 'email',
			definition: {
				type: Model.ColumnType.String,
				columnType: 'text',
				nullable: true,
				deprecationReason: 'deprecated',
			},
		},
	],
	sql: SQL``,
}))

describe('remove deprecation flag from column', () => testMigrations({
	original: {
		model: new SchemaBuilder()
			.entity('Author', entity =>
				entity.column('email', c => c.type(Model.ColumnType.String).deprecated('deprecated')))
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('Author', entity => entity.column('email', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	diff: [
		{
			modification: 'updateColumnDefinition',
			entityName: 'Author',
			fieldName: 'email',
			definition: {
				type: Model.ColumnType.String,
				columnType: 'text',
				nullable: true,
			},
		},
	],
	sql: SQL``,
}))

describe('create new column with deprecation flag', () => testMigrations({
	original: {
		model: new SchemaBuilder()
			.entity('Author', entity => entity.column('email', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('Author', entity =>
				entity
					.column('email', c => c.type(Model.ColumnType.String))
					.column('oldField', c => c.type(Model.ColumnType.String).deprecated('This field will be removed in v2.0')))
			.buildSchema(),
	},
	diff: [
		{
			modification: 'createColumn',
			entityName: 'Author',
			field: {
				name: 'oldField',
				columnName: 'old_field',
				type: Model.ColumnType.String,
				columnType: 'text',
				nullable: true,
				deprecationReason: 'This field will be removed in v2.0',
			},
		},
	],
	sql: SQL`
		ALTER TABLE "author"
			ADD "old_field" text;
	`,
}))
