import { testMigrations } from '../../src/tests'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'
import { SchemaDefinition as def } from '@contember/schema-definition'


testMigrations('remove relation (many has one)', {
	originalSchema: new SchemaBuilder()
		.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
		.entity('Post', e =>
			e
				.column('title', c => c.type(Model.ColumnType.String))
				.manyHasOne('author', r => r.target('Author').onDelete(Model.OnDelete.cascade)),
		)
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
		.entity('Post', e => e.column('title', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	diff: [
		{
			modification: 'removeField',
			entityName: 'Post',
			fieldName: 'author',
		},
	],
	sql: SQL`ALTER TABLE "post"
		DROP "author_id";`,
})

testMigrations('remove relation (one has many)', {
	originalSchema: new SchemaBuilder()
		.entity('Post', e => e.oneHasMany('locales', r => r.target('PostLocale').ownerNotNull().ownedBy('post')))
		.entity('PostLocale', e =>
			e
				.unique(['post', 'locale'])
				.column('title', c => c.type(Model.ColumnType.String))
				.column('locale', c => c.type(Model.ColumnType.String)),
		)
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Post', e => e)
		.entity('PostLocale', e =>
			e.column('title', c => c.type(Model.ColumnType.String)).column('locale', c => c.type(Model.ColumnType.String)),
		)
		.buildSchema(),
	diff: [
		{
			constraintName: 'unique_PostLocale_post_locale_5759e8',
			entityName: 'PostLocale',
			modification: 'removeUniqueConstraint',
		},
		{
			modification: 'removeField',
			entityName: 'PostLocale',
			fieldName: 'post',
		},
	],
	sql: SQL`ALTER TABLE "post_locale" DROP CONSTRAINT "unique_PostLocale_post_locale_5759e8";
						ALTER TABLE "post_locale" DROP "post_id";`,
})

testMigrations('remove relation (many has many)', {
	originalSchema: new SchemaBuilder()
		.entity('Post', e =>
			e.column('title', c => c.type(Model.ColumnType.String)).manyHasMany('categories', r => r.target('Category')),
		)
		.entity('Category', e => e.column('title', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Post', e => e.column('title', c => c.type(Model.ColumnType.String)))
		.entity('Category', e => e.column('title', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	diff: [
		{
			modification: 'removeField',
			entityName: 'Post',
			fieldName: 'categories',
		},
	],
	sql: SQL`DROP TABLE "post_categories";`,
})

testMigrations('remove relation (one has one)', {
	originalSchema: new SchemaBuilder()
		.entity('Site', entity =>
			entity
				.column('name', c => c.type(Model.ColumnType.String))
				.oneHasOne('setting', r => r.target('SiteSetting').inversedBy('site')),
		)
		.entity('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Site', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
		.entity('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	diff: [
		{
			modification: 'removeField',
			entityName: 'Site',
			fieldName: 'setting',
		},
	],
	sql: SQL`ALTER TABLE "site" DROP CONSTRAINT "unique_Site_setting_8653a0";
						ALTER TABLE "site" DROP "setting_id";`,
})

testMigrations('remove relation inverse side', {
	originalSchema: new SchemaBuilder()
		.entity('Site', entity =>
			entity
				.column('name', c => c.type(Model.ColumnType.String))
				.oneHasOne('setting', r => r.target('SiteSetting').inversedBy('site')),
		)
		.entity('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Site', entity =>
			entity.column('name', c => c.type(Model.ColumnType.String)).oneHasOne('setting', r => r.target('SiteSetting')),
		)
		.entity('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	diff: [
		{
			modification: 'removeField',
			entityName: 'SiteSetting',
			fieldName: 'site',
		},
	],
	sql: SQL``,
})


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


testMigrations('test drop index / unique when removing a field', {
	originalSchema: def.createModel(DropIndexOrigSchema),
	updatedSchema: def.createModel(DropIndexUpSchema),
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
		unique: { name: 'unique_Article_title_author_7157ea', fields: ['title', 'author'] },
	}, {
		modification: 'createIndex',
		entityName: 'Article',
		index: { name: 'idx_Article_title_author_7157ea', fields: ['title', 'author'] },
	}],
	sql: SQL`ALTER TABLE "article" DROP "author_id";
ALTER TABLE "article" ADD "author" text;
ALTER TABLE "article" ADD CONSTRAINT "unique_Article_title_author_7157ea" UNIQUE ("title", "author");
CREATE INDEX "idx_Article_title_author_7157ea" ON "article" ("title", "author");`,
})

