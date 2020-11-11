import { SchemaBuilder } from '@contember/schema-definition'
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
	CREATE TRIGGER "log_event_statement"
		AFTER INSERT OR UPDATE OR DELETE
		ON "author"
		FOR EACH STATEMENT
	EXECUTE PROCEDURE "system"."statement_trigger_event"();
	ALTER TABLE "author"
		ADD "name" text;
	ALTER TABLE "author"
		ADD "email" text;
	ALTER TABLE "author"
		ADD "registered_at" date;
	ALTER TABLE "author"
		ADD CONSTRAINT "unique_Author_email_a3e587" UNIQUE ("email");`,
})
