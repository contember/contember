import { testMigrations } from '../../src/tests'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'

testMigrations('create one has one relation (site with settings)', {
	originalSchema: new SchemaBuilder().buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Site', entity =>
			entity
				.column('name', c => c.type(Model.ColumnType.String))
				.oneHasOne('setting', r => r.target('SiteSetting').inversedBy('site')),
		)
		.entity('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
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
				name: 'Site',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'site',
				unique: {},
			},
		},
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
				name: 'SiteSetting',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'site_setting',
				unique: {},
			},
		},
		{
			modification: 'createColumn',
			entityName: 'Site',
			field: {
				columnName: 'name',
				name: 'name',
				nullable: true,
				type: Model.ColumnType.String,
				columnType: 'text',
			},
		},
		{
			modification: 'createColumn',
			entityName: 'SiteSetting',
			field: {
				columnName: 'url',
				name: 'url',
				nullable: true,
				type: Model.ColumnType.String,
				columnType: 'text',
			},
		},
		{
			modification: 'createRelation',
			entityName: 'Site',
			owningSide: {
				name: 'setting',
				type: Model.RelationType.OneHasOne,
				target: 'SiteSetting',
				inversedBy: 'site',
				joiningColumn: {
					columnName: 'setting_id',
					onDelete: Model.OnDelete.restrict,
				},
				nullable: true,
			},
			inverseSide: {
				name: 'site',
				type: Model.RelationType.OneHasOne,
				target: 'Site',
				ownedBy: 'setting',
				nullable: true,
			},
		},
	],
	sql: SQL`CREATE TABLE "site" (
		"id" uuid PRIMARY KEY NOT NULL
	);
	CREATE TRIGGER "log_event"
		AFTER INSERT OR UPDATE OR DELETE
		ON "site"
		FOR EACH ROW
	EXECUTE PROCEDURE "system"."trigger_event"($pga$id$pga$);
	CREATE CONSTRAINT TRIGGER "log_event_trx"
		AFTER INSERT OR UPDATE OR DELETE
		ON "site"
		DEFERRABLE INITIALLY DEFERRED
		FOR EACH ROW
	EXECUTE PROCEDURE "system"."trigger_event_commit"();
	CREATE TABLE "site_setting" (
		"id" uuid PRIMARY KEY NOT NULL
	);
	CREATE TRIGGER "log_event"
		AFTER INSERT OR UPDATE OR DELETE
		ON "site_setting"
		FOR EACH ROW
	EXECUTE PROCEDURE "system"."trigger_event"($pga$id$pga$);
	CREATE CONSTRAINT TRIGGER "log_event_trx"
		AFTER INSERT OR UPDATE OR DELETE
		ON "site_setting"
		DEFERRABLE INITIALLY DEFERRED
		FOR EACH ROW
	EXECUTE PROCEDURE "system"."trigger_event_commit"();
	ALTER TABLE "site"
		ADD "name" text;
	ALTER TABLE "site_setting"
		ADD "url" text;
	ALTER TABLE "site"
		ADD "setting_id" uuid;
	ALTER TABLE "site"
		ADD CONSTRAINT "fk_site_setting_id_6a4aa6" FOREIGN KEY ("setting_id") REFERENCES "site_setting"("id") ON DELETE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;
	ALTER TABLE "site"
		ADD CONSTRAINT "unique_Site_setting_8653a0" UNIQUE ("setting_id");
		`,
})
