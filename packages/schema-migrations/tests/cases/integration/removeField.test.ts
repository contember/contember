import { describe } from 'bun:test'
import { testMigrations } from '../../src/tests'
import { createSchema, SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'
import { SchemaDefinition as def } from '@contember/schema-definition'
import { createDatabaseMetadata } from '@contember/database'


describe('remove relation (many has one)', () => testMigrations({
	original: {
		model: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.entity('Post', e =>
				e
					.column('title', c => c.type(Model.ColumnType.String))
					.manyHasOne('author', r => r.target('Author').onDelete(Model.OnDelete.cascade)),
			)
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.entity('Post', e => e.column('title', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	diff: [
		{
			modification: 'removeField',
			entityName: 'Post',
			fieldName: 'author',
		},
	],
	sql: SQL`ALTER TABLE "post"
		DROP "author_id";`,
}))

describe('remove relation (one has many)', () => testMigrations({
	original: {
		model: new SchemaBuilder()
			.entity('Post', e => e.oneHasMany('locales', r => r.target('PostLocale').ownerNotNull().ownedBy('post')))
			.entity('PostLocale', e =>
				e
					.unique(['post', 'locale'])
					.column('title', c => c.type(Model.ColumnType.String))
					.column('locale', c => c.type(Model.ColumnType.String)),
			)
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('Post', e => e)
			.entity('PostLocale', e =>
				e.column('title', c => c.type(Model.ColumnType.String)).column('locale', c => c.type(Model.ColumnType.String)),
			)
			.buildSchema(),
	},
	diff: [
		{
			entityName: 'PostLocale',
			fields: ['post', 'locale'],
			modification: 'removeUniqueConstraint',
		},
		{
			modification: 'removeField',
			entityName: 'PostLocale',
			fieldName: 'post',
		},
	],
	sql: SQL`ALTER TABLE "post_locale" DROP CONSTRAINT "uniq_post_locale_post_id_locale";
						ALTER TABLE "post_locale" DROP "post_id";`,
	databaseMetadata: createDatabaseMetadata({
		foreignKeys: [],
		indexes: [],
		uniqueConstraints: [{
			constraintName: 'uniq_post_locale_post_id_locale',
			columnNames: ['post_id', 'locale'],
			tableName: 'post_locale',
			deferrable: false,
			deferred: false,
		}],
	}),
}))

describe('remove relation (many has many)', () => testMigrations({
	original: {
		model: new SchemaBuilder()
			.entity('Post', e =>
				e.column('title', c => c.type(Model.ColumnType.String)).manyHasMany('categories', r => r.target('Category')),
			)
			.entity('Category', e => e.column('title', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('Post', e => e.column('title', c => c.type(Model.ColumnType.String)))
			.entity('Category', e => e.column('title', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	diff: [
		{
			modification: 'removeField',
			entityName: 'Post',
			fieldName: 'categories',
		},
	],
	sql: SQL`DROP TABLE "post_categories";`,
}))

describe('remove relation (one has one)', () => testMigrations({
	original: {
		model: new SchemaBuilder()
			.entity('Site', entity =>
				entity
					.column('name', c => c.type(Model.ColumnType.String))
					.oneHasOne('setting', r => r.target('SiteSetting').inversedBy('site')),
			)
			.entity('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('Site', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
			.entity('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	diff: [
		{
			modification: 'removeField',
			entityName: 'Site',
			fieldName: 'setting',
		},
	],
	sql: SQL`ALTER TABLE "site" DROP "setting_id";`,
}))

describe('remove relation inverse side', () => testMigrations({
	original: {
		model: new SchemaBuilder()
			.entity('Site', entity =>
				entity
					.column('name', c => c.type(Model.ColumnType.String))
					.oneHasOne('setting', r => r.target('SiteSetting').inversedBy('site')),
			)
			.entity('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('Site', entity =>
				entity.column('name', c => c.type(Model.ColumnType.String)).oneHasOne('setting', r => r.target('SiteSetting')),
			)
			.entity('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	diff: [
		{
			modification: 'removeField',
			entityName: 'SiteSetting',
			fieldName: 'site',
		},
	],
	sql: SQL``,
}))


namespace DropIndexOrigSchema {

	@def.Unique('title', 'author')
	@def.Index('title', 'author')
	export class Article {
		title = def.stringColumn()
		author = def.manyHasOne(Author)
	}

	export class Author {
		name = def.stringColumn()
	}
}

namespace DropIndexUpSchema {
	@def.Unique('title', 'author')
	@def.Index('title', 'author')
	export class Article {
		title = def.stringColumn()
		author = def.stringColumn()
	}

	export class Author {
		name = def.stringColumn()
	}
}


describe('test drop index / unique when removing a field', () => testMigrations({
	original: createSchema(DropIndexOrigSchema),
	updated: createSchema(DropIndexUpSchema),
	diff: [{
		modification: 'removeField',
		entityName: 'Article',
		fieldName: 'author',
	}, {
		modification: 'createColumn',
		entityName: 'Article',
		field: { name: 'author', columnName: 'author', nullable: true, type: 'String', columnType: 'text' },
	}, {
		modification: 'createUniqueConstraint',
		entityName: 'Article',
		unique: { fields: ['title', 'author'] },
	}, {
		modification: 'createIndex',
		entityName: 'Article',
		index: { fields: ['title', 'author'] },
	}],
	sql: SQL`ALTER TABLE "article" DROP "author_id";
ALTER TABLE "article" ADD "author" text;
ALTER TABLE "article" ADD UNIQUE ("title", "author");
CREATE INDEX ON "article" ("title", "author");`,
}))

