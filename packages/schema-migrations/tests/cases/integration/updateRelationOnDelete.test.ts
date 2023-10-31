import { testMigrations } from '../../src/tests'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'
import { ForeignKeyDeleteAction, createDatabaseMetadata } from '@contember/database'

testMigrations('update relation ondelete to cascade', {
	original: {
		model: new SchemaBuilder()
			.entity('Post', entity =>
				entity.column('name', c => c.type(Model.ColumnType.String)).manyHasOne('category', r => r.target('Category')),
			)
			.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('Post', entity =>
				entity
					.column('name', c => c.type(Model.ColumnType.String))
					.manyHasOne('category', r => r.target('Category').onDelete(Model.OnDelete.cascade)),
			)
			.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	diff: [
		{
			modification: 'updateRelationOnDelete',
			entityName: 'Post',
			fieldName: 'category',
			onDelete: Model.OnDelete.cascade,
		},
	],
	sql: SQL`ALTER TABLE "post" DROP CONSTRAINT "fk_post_category_id_category_id"; 
ALTER TABLE "post" ADD FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;`,
	databaseMetadata: createDatabaseMetadata({
		foreignKeys: [
			{
				constraintName: 'fk_post_category_id_category_id',
				deleteAction: ForeignKeyDeleteAction.cascade,
				fromColumn: 'category_id',
				fromTable: 'post',
				toColumn: 'id',
				toTable: 'category',
			},
		],
		indexes: [],
		uniqueConstraints: [],
	}),
})
