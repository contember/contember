import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'
import { testMigrations } from '../../src/tests'

testMigrations('create a column with default value', {
	original: createSchema({
		Author: class Author {
			email = def.stringColumn().unique()
		},
	}),
	updated: createSchema({
		Author: class Author {
			name = def.stringColumn().notNull()
			email = def.stringColumn().unique()
		},
	}),
	noDiff: true,
	diff: [
		{
			modification: 'createColumn',
			entityName: 'Author',
			field: {
				columnName: 'name',
				name: 'name',
				nullable: false,
				type: Model.ColumnType.String,
				columnType: 'text',
			},
			fillValue: 'unnamed author',
		},
	],
	sql: SQL`ALTER TABLE "author" ADD "name" text;
UPDATE "author" SET "name" = $pga$unnamed author$pga$;
SET CONSTRAINTS ALL IMMEDIATE; SET CONSTRAINTS ALL DEFERRED;
ALTER TABLE "author" ALTER "name" SET NOT NULL;`,
})

testMigrations('create a column with copy value', {
	original: createSchema({
		Author: class Author {
			email = def.stringColumn().unique()
		},
	}),
	updated: createSchema({
		Author: class Author {
			name = def.stringColumn().notNull()
			email = def.stringColumn().unique()
		},
	}),
	diff: [
		{
			modification: 'createColumn',
			entityName: 'Author',
			field: {
				columnName: 'name',
				name: 'name',
				nullable: false,
				type: Model.ColumnType.String,
				columnType: 'text',
			},
			copyValue: 'email',
		},
	],
	noDiff: true,
	sql: SQL`ALTER TABLE "author" ADD "name" text;
UPDATE "author" SET "name" = "email"::text;
SET CONSTRAINTS ALL IMMEDIATE; SET CONSTRAINTS ALL DEFERRED;
ALTER TABLE "author" ALTER "name" SET NOT NULL;`,
})


testMigrations('create a column with default value with "using"', {
	original: createSchema({
		Author: class Author {
			email = def.stringColumn().unique()
		},
	}),
	updated: createSchema({
		Author: class Author {
			name = def.stringColumn().default('unnamed author').notNull()
			order = def.intColumn().default(0).notNull()
			score = def.doubleColumn().default(1 / 3).notNull()
			active = def.boolColumn().default(false).notNull()
			createdAt = def.dateTimeColumn().default('2024-01-01 10:00').notNull()
			email = def.stringColumn().unique()
		},
	}),
	diff: [
		{
			modification: 'createColumn',
			entityName: 'Author',
			field: {
				columnName: 'name',
				name: 'name',
				nullable: false,
				default: 'unnamed author',
				type: Model.ColumnType.String,
				columnType: 'text',
			},
			fillValue: 'unnamed author',
			valueMigrationStrategy: 'using',
		},
		{
			modification: 'createColumn',
			entityName: 'Author',
			field: {
				columnName: 'order',
				name: 'order',
				nullable: false,
				default: 0,
				type: Model.ColumnType.Int,
				columnType: 'integer',
			},
			fillValue: 0,
			valueMigrationStrategy: 'using',
		},
		{
			modification: 'createColumn',
			entityName: 'Author',
			field: {
				columnName: 'score',
				name: 'score',
				nullable: false,
				default: 0.3333333333333333,
				type: Model.ColumnType.Double,
				columnType: 'double precision',
			},
			fillValue: 0.3333333333333333,
			valueMigrationStrategy: 'using',
		},
		{
			modification: 'createColumn',
			entityName: 'Author',
			field: {
				columnName: 'active',
				name: 'active',
				nullable: false,
				default: false,
				type: Model.ColumnType.Bool,
				columnType: 'boolean',
			},
			fillValue: false,
			valueMigrationStrategy: 'using',
		},
		{
			modification: 'createColumn',
			entityName: 'Author',
			field: {
				columnName: 'created_at',
				name: 'createdAt',
				nullable: false,
				default: '2024-01-01 10:00',
				type: Model.ColumnType.DateTime,
				columnType: 'timestamptz',
			},
			fillValue: '2024-01-01 10:00',
			valueMigrationStrategy: 'using',
		},
	],
	sql: SQL`
ALTER TABLE "author" ADD "name" text;
ALTER TABLE "author" ALTER "name" SET DATA TYPE text USING $pga$unnamed author$pga$, ALTER "name" SET NOT NULL;
ALTER TABLE "author" ADD "order" integer;
ALTER TABLE "author" ALTER "order" SET DATA TYPE integer USING 0, ALTER "order" SET NOT NULL;
ALTER TABLE "author" ADD "score" double precision;
ALTER TABLE "author" ALTER "score" SET DATA TYPE double precision USING 0.3333333333333333, ALTER "score" SET NOT NULL;
ALTER TABLE "author" ADD "active" boolean; 
ALTER TABLE "author" ALTER "active" SET DATA TYPE boolean USING false, 
ALTER "active" SET NOT NULL; ALTER TABLE "author" ADD "created_at" timestamptz; 
ALTER TABLE "author" ALTER "created_at" SET DATA TYPE timestamptz USING $pga$2024-01-01 10:00$pga$, ALTER "created_at" SET NOT NULL;
`,
})
