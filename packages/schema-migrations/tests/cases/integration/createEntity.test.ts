import { createSchema, SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'
import { describe } from 'bun:test'
import { testMigrations } from '../../src/tests'
import { SchemaDefinition as def } from '@contember/schema-definition'

describe('create a table (no relations, unique on column)', () => testMigrations({
	original: {  },
	updated: {
		model: new SchemaBuilder()
			.entity('Author', e =>
				e
					.column('name', c => c.type(Model.ColumnType.String))
					.column('email', c => c.type(Model.ColumnType.String).unique())
					.column('registeredAt', c => c.type(Model.ColumnType.Date)),
			)
			.buildSchema(),
	},
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
				unique: [],
				eventLog: {
					enabled: true,
				},
				indexes: [],
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
			unique: { fields: ['email'] },
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
		ADD UNIQUE ("email");`,
}))

namespace ViewEntityUpdatedSchema {
	@def.View("SELECT null as id, 'John' AS name")
	export class Author {
		name = def.stringColumn()
	}
}
describe('create a view', () => testMigrations({
	original: {},
	updated: createSchema(ViewEntityUpdatedSchema),
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
				unique: [],
				view: { sql: "SELECT null as id, 'John' AS name" },
				eventLog: {
					enabled: true,
				},
				indexes: [],
			},
		},
	],
	sql: SQL`CREATE VIEW "author" AS SELECT null as id, 'John' AS name;`,
}))
