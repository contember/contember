import { testMigrations } from '../../src/tests'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'

testMigrations('make relation nullable', {
	originalSchema: new SchemaBuilder()
		.entity('Post', entity =>
			entity
				.column('name', c => c.type(Model.ColumnType.String))
				.manyHasOne('category', r => r.target('Category').notNull()),
		)
		.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Post', entity =>
			entity.column('name', c => c.type(Model.ColumnType.String)).manyHasOne('category', r => r.target('Category')),
		)
		.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	diff: [
		{
			modification: 'makeRelationNullable',
			entityName: 'Post',
			fieldName: 'category',
		},
	],
	sql: SQL`ALTER TABLE "post"
		ALTER "category_id" DROP NOT NULL;`,
})

testMigrations('make inversed relation nullable', {
	originalSchema: new SchemaBuilder()
		.entity('Post', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
		.entity('Link', e => e.oneHasOne('post', r => r.target('Post').inversedNotNull().inversedBy('link')))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Post', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
		.entity('Link', e => e.oneHasOne('post', r => r.target('Post').inversedBy('link')))
		.buildSchema(),
	diff: [
		{
			modification: 'makeRelationNullable',
			entityName: 'Post',
			fieldName: 'link',
		},
	],
	sql: SQL``,
})
