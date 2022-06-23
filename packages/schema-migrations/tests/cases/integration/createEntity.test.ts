import { SchemaBuilder, SchemaDefinition as def } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'
import { testMigrations } from '../../src/tests'

testMigrations('create a table (no relations, unique on column)', {
	originalSchema: new SchemaBuilder().buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Author', e =>
			e
				.column('name', c => c.type(Model.ColumnType.String))
				.column('email', c => c.type(Model.ColumnType.String).unique())
				.column('registeredAt', c => c.type(Model.ColumnType.Date)),
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
				name: 'Author',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'author',
				unique: {},
				eventLog: {
					enabled: true,
				},
			},
		},
		{
			modification: 'createColumn',
			entityName: 'Author',
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
			entityName: 'Author',
			field: {
				columnName: 'email',
				name: 'email',
				nullable: true,
				type: Model.ColumnType.String,
				columnType: 'text',
			},
		},
		{
			modification: 'createColumn',
			entityName: 'Author',
			field: {
				columnName: 'registered_at',
				name: 'registeredAt',
				nullable: true,
				type: Model.ColumnType.Date,
				columnType: 'date',
			},
		},
		{
			modification: 'createUniqueConstraint',
			entityName: 'Author',
			unique: {
				name: 'unique_Author_email_a3e587',
				fields: ['email'],
			},
		},
	],
	sql: SQL`CREATE TABLE "author" (
		"id" uuid PRIMARY KEY NOT NULL
	);
	CREATE TRIGGER "log_event"
		AFTER INSERT OR UPDATE OR DELETE
		ON "author"
		FOR EACH ROW
	EXECUTE PROCEDURE "system"."trigger_event"($pga$id$pga$);
	CREATE CONSTRAINT TRIGGER "log_event_trx"
		AFTER INSERT OR UPDATE OR DELETE
		ON "author"
		DEFERRABLE INITIALLY DEFERRED
		FOR EACH ROW
	EXECUTE PROCEDURE "system"."trigger_event_commit"();
	ALTER TABLE "author"
		ADD "name" text;
	ALTER TABLE "author"
		ADD "email" text;
	ALTER TABLE "author"
		ADD "registered_at" date;
	ALTER TABLE "author"
		ADD CONSTRAINT "unique_Author_email_a3e587" UNIQUE ("email");`,
})

namespace ViewEntityUpdatedSchema {
	@def.View("SELECT null as id, 'John' AS name")
	export class Author {
		name = def.stringColumn()
	}
}
testMigrations('create a view', {
	originalSchema: new SchemaBuilder().buildSchema(),
	updatedSchema: def.createModel(ViewEntityUpdatedSchema),
	diff: [
		{
			modification: 'createView',
			entity: {
				fields: {
					id: {
						columnName: 'id',
						name: 'id',
						nullable: false,
						type: Model.ColumnType.Uuid,
						columnType: 'uuid',
					},
					name: {
						columnName: 'name',
						name: 'name',
						nullable: true,
						type: Model.ColumnType.String,
						columnType: 'text',
					},
				},
				name: 'Author',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'author',
				unique: {},
				view: { sql: "SELECT null as id, 'John' AS name" },
				eventLog: {
					enabled: true,
				},
			},
		},
	],
	sql: SQL`CREATE VIEW "author" AS SELECT null as id, 'John' AS name;`,
})
