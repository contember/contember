import { testMigrations } from '../../src/tests.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags.js'

testMigrations('create many has many relation (post with categories)', {
	originalSchema: new SchemaBuilder()
		.entity('Post', e => e.column('title', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Post', e =>
			e.column('title', c => c.type(Model.ColumnType.String)).manyHasMany('categories', r => r.target('Category')),
		)
		.entity('Category', e => e.column('title', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	diff: [
		{
			modification: 'createEntity',
			entity: {
				fields: {
					id: {
						columnName: 'id',
						name: 'id',
						nullable: false,
						type: Model.ColumnType.Uuid,
						columnType: 'uuid',
					},
				},
				name: 'Category',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'category',
				unique: {},
				eventLog: {
					enabled: true,
				},
			},
		},
		{
			modification: 'createColumn',
			entityName: 'Category',
			field: {
				columnName: 'title',
				name: 'title',
				nullable: true,
				type: Model.ColumnType.String,
				columnType: 'text',
			},
		},
		{
			modification: 'createRelation',
			entityName: 'Post',
			owningSide: {
				name: 'categories',
				type: Model.RelationType.ManyHasMany,
				target: 'Category',
				joiningTable: {
					tableName: 'post_categories',
					joiningColumn: {
						columnName: 'post_id',
						onDelete: Model.OnDelete.cascade,
					},
					inverseJoiningColumn: {
						columnName: 'category_id',
						onDelete: Model.OnDelete.cascade,
					},
					eventLog: {
						enabled: true,
					},
				},
			},
		},
	],
	sql: SQL`CREATE TABLE "category" (
		"id" uuid PRIMARY KEY NOT NULL
	);
	CREATE TRIGGER "log_event"
		AFTER INSERT OR UPDATE OR DELETE
		ON "category"
		FOR EACH ROW
	EXECUTE PROCEDURE "system"."trigger_event"($pga$id$pga$);
	CREATE CONSTRAINT TRIGGER "log_event_trx"
		AFTER INSERT OR UPDATE OR DELETE
		ON "category"
		DEFERRABLE INITIALLY DEFERRED
		FOR EACH ROW
	EXECUTE PROCEDURE "system"."trigger_event_commit"();
	ALTER TABLE "category"
		ADD "title" text;
	CREATE TABLE "post_categories" (
		"post_id"     uuid NOT NULL REFERENCES "post"("id") ON DELETE CASCADE,
		"category_id" uuid NOT NULL REFERENCES "category"("id") ON DELETE CASCADE,
		CONSTRAINT "post_categories_pkey" PRIMARY KEY ("post_id", "category_id")
	);
	CREATE TRIGGER "log_event"
		AFTER INSERT OR UPDATE OR DELETE
		ON "post_categories"
		FOR EACH ROW
	EXECUTE PROCEDURE "system"."trigger_event"($pga$post_id$pga$, $pga$category_id$pga$);
		CREATE CONSTRAINT TRIGGER "log_event_trx"
		AFTER INSERT OR UPDATE OR DELETE
		ON "post_categories"
		DEFERRABLE INITIALLY DEFERRED
		FOR EACH ROW
	EXECUTE PROCEDURE "system"."trigger_event_commit"();`,
})
