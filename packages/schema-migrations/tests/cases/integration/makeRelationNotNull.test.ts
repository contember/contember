import { testMigrations } from '../../src/tests.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags.js'

testMigrations('make relation not null', {
	originalSchema: new SchemaBuilder()
		.entity('Post', entity =>
			entity.column('name', c => c.type(Model.ColumnType.String)).manyHasOne('category', r => r.target('Category')),
		)
		.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Post', entity =>
			entity
				.column('name', c => c.type(Model.ColumnType.String))
				.manyHasOne('category', r => r.target('Category').notNull()),
		)
		.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	diff: [
		{
			modification: 'makeRelationNotNull',
			entityName: 'Post',
			fieldName: 'category',
		},
	],
	sql: SQL`ALTER TABLE "post"
		ALTER "category_id" SET NOT NULL;`,
})
