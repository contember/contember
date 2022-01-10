import { testMigrations } from '../../src/tests'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'

testMigrations('create one has many relation (post with locales)', {
	originalSchema: new SchemaBuilder().entity('Post', e => e).buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Post', e =>
			e.oneHasMany('locales', r => r.target('PostLocale').ownerNotNull().ownedBy('post').orderBy('title')),
		)
		.entity('PostLocale', e =>
			e
				.unique(['post', 'locale'])
				.column('title', c => c.type(Model.ColumnType.String))
				.column('locale', c => c.type(Model.ColumnType.String)),
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
				name: 'PostLocale',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'post_locale',
				unique: {},
				eventLog: {
					enabled: true,
				},
			},
		},
		{
			modification: 'createColumn',
			entityName: 'PostLocale',
			field: {
				columnName: 'title',
				name: 'title',
				nullable: true,
				type: Model.ColumnType.String,
				columnType: 'text',
			},
		},
		{
			modification: 'createColumn',
			entityName: 'PostLocale',
			field: {
				columnName: 'locale',
				name: 'locale',
				nullable: true,
				type: Model.ColumnType.String,
				columnType: 'text',
			},
		},
		{
			modification: 'createRelation',
			entityName: 'PostLocale',
			owningSide: {
				name: 'post',
				type: Model.RelationType.ManyHasOne,
				target: 'Post',
				inversedBy: 'locales',
				joiningColumn: {
					columnName: 'post_id',
					onDelete: Model.OnDelete.restrict,
				},
				nullable: false,
			},
			inverseSide: {
				name: 'locales',
				type: Model.RelationType.OneHasMany,
				target: 'PostLocale',
				ownedBy: 'post',
				orderBy: [
					{
						path: ['title'],
						direction: 'asc',
					},
				],
			},
		},
		{
			modification: 'createUniqueConstraint',
			entityName: 'PostLocale',
			unique: {
				name: 'unique_PostLocale_post_locale_5759e8',
				fields: ['post', 'locale'],
			},
		},
	],
	sql: SQL`CREATE TABLE "post_locale" (
		"id" uuid PRIMARY KEY NOT NULL
	);
	CREATE TRIGGER "log_event"
		AFTER INSERT OR UPDATE OR DELETE
		ON "post_locale"
		FOR EACH ROW
	EXECUTE PROCEDURE "system"."trigger_event"($pga$id$pga$);
	CREATE CONSTRAINT TRIGGER "log_event_trx"
		AFTER INSERT OR UPDATE OR DELETE
		ON "post_locale"
		DEFERRABLE INITIALLY DEFERRED
		FOR EACH ROW
	EXECUTE PROCEDURE "system"."trigger_event_commit"();
	ALTER TABLE "post_locale"
		ADD "title" text;
	ALTER TABLE "post_locale"
		ADD "locale" text;
	ALTER TABLE "post_locale"
		ADD "post_id" uuid NOT NULL;
	ALTER TABLE "post_locale"
		ADD CONSTRAINT "fk_post_locale_post_id_f3d2e5" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;
	CREATE INDEX "post_locale_post_id_index" ON "post_locale" ("post_id");
	ALTER TABLE "post_locale"
		ADD CONSTRAINT "unique_PostLocale_post_locale_5759e8" UNIQUE ("post_id", "locale");`,
})
