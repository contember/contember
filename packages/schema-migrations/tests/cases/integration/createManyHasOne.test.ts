import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'
import { testMigrations } from '../../src/tests'

testMigrations('create many has one relation (post with author)', {
	originalSchema: new SchemaBuilder()
		.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
		.entity('Post', e =>
			e
				.column('title', c => c.type(Model.ColumnType.String))
				.manyHasOne('author', r => r.target('Author').onDelete(Model.OnDelete.cascade)),
		)
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
				name: 'Post',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'post',
				unique: {},
				eventLog: {
					enabled: true,
				},
				indexes: {},
			},
		},
		{
			modification: 'createColumn',
			entityName: 'Post',
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
				name: 'author',
				type: Model.RelationType.ManyHasOne,
				target: 'Author',
				joiningColumn: {
					columnName: 'author_id',
					onDelete: Model.OnDelete.cascade,
				},
				nullable: true,
			},
		},
	],
	sql: SQL`CREATE TABLE "post" (
		"id" uuid PRIMARY KEY NOT NULL
	);
	CREATE TRIGGER "log_event"
		AFTER INSERT OR UPDATE OR DELETE
		ON "post"
		FOR EACH ROW
	EXECUTE PROCEDURE "system"."trigger_event"($pga$id$pga$);
	CREATE CONSTRAINT TRIGGER "log_event_trx"
		AFTER INSERT OR UPDATE OR DELETE
		ON "post"
		DEFERRABLE INITIALLY DEFERRED
		FOR EACH ROW
	EXECUTE PROCEDURE "system"."trigger_event_commit"();
	ALTER TABLE "post"
		ADD "title" text;
	ALTER TABLE "post"
		ADD "author_id" uuid;
	ALTER TABLE "post"
		ADD CONSTRAINT "fk_post_author_id_87ef9a" FOREIGN KEY ("author_id") REFERENCES "author"("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
	CREATE INDEX "post_author_id_index" ON "post" ("author_id");`,
})
