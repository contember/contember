import { testMigrations } from '../../src/tests'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'

testMigrations('update relation ondelete to cascade', {
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
				.manyHasOne('category', r => r.target('Category').onDelete(Model.OnDelete.cascade)),
		)
		.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	diff: [
		{
			modification: 'updateRelationOnDelete',
			entityName: 'Post',
			fieldName: 'category',
			onDelete: Model.OnDelete.cascade,
		},
	],
	sql: SQL`ALTER TABLE "post" DROP CONSTRAINT "fk_post_category_id_820029";
ALTER TABLE "post" ADD CONSTRAINT "fk_post_category_id_820029" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;`,
})
