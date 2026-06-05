import { describe } from 'bun:test'
import { testMigrations } from '../../src/tests.js'
import { SQL } from '../../src/tags.js'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'

namespace ViewEntityOriginalSchema {
	@def.View("SELECT null as id, 'John' AS name")
	export class Author {
		name = def.stringColumn()
	}

	@def.View('SELECT * FROM author', { dependencies: [Author] })
	export class Author2 {
		name = def.stringColumn()
	}

	@def.View('SELECT * FROM author2', { dependencies: [Author2] })
	export class Author3 {
		name = def.stringColumn()
	}
}

namespace ViewEntityUpdatedSchema1 {
	@def.View("SELECT null as id, 'Jack' AS name")
	export class Author {
		name = def.stringColumn()
	}

	@def.View('SELECT * FROM author', { dependencies: [Author] })
	export class Author2 {
		name = def.stringColumn()
	}

	@def.View('SELECT * FROM author2', { dependencies: [Author2] })
	export class Author3 {
		name = def.stringColumn()
	}
}

describe('update a view 1 - replace sql in-place, no dependant cascade', () =>
	testMigrations({
		original: createSchema(ViewEntityOriginalSchema),
		updated: createSchema(ViewEntityUpdatedSchema1),
		diff: [
			{
				modification: 'updateView',
				entityName: 'Author',
				view: {
					sql: "SELECT null as id, 'Jack' AS name",
				},
			},
		],
		sql: SQL`CREATE OR REPLACE VIEW "author" AS SELECT null as id, 'Jack' AS name;`,
	}))

namespace ViewEntityUpdatedSchema2 {
	@def.View("SELECT null as id, 'John' AS name")
	export class Author {
		name = def.stringColumn()
	}

	@def.View('SELECT id, name FROM author', { dependencies: [Author] })
	export class Author2 {
		name = def.stringColumn()
	}

	@def.View('SELECT * FROM author2', { dependencies: [Author2] })
	export class Author3 {
		name = def.stringColumn()
	}
}

describe('update a view 2 - replace dependency in-place', () =>
	testMigrations({
		original: createSchema(ViewEntityOriginalSchema),
		updated: createSchema(ViewEntityUpdatedSchema2),
		diff: [
			{
				modification: 'updateView',
				entityName: 'Author2',
				view: {
					sql: 'SELECT id, name FROM author',
					dependencies: [
						'Author',
					],
				},
			},
		],
		sql: SQL`CREATE OR REPLACE VIEW "author2" AS SELECT id, name FROM author;`,
	}))

namespace ViewEntityUpdatedSchema3 {
	@def.View("SELECT null as id, 'John' AS name")
	export class Author {
		name = def.stringColumn()
	}

	@def.View('SELECT * FROM author', { dependencies: [Author] })
	export class Author2 {
		name = def.stringColumn()
	}

	@def.View('SELECT id, name FROM author2', { dependencies: [Author2] })
	export class Author3 {
		name = def.stringColumn()
	}
}

describe('update a view 3 - replace leaf view in-place', () =>
	testMigrations({
		original: createSchema(ViewEntityOriginalSchema),
		updated: createSchema(ViewEntityUpdatedSchema3),
		diff: [
			{
				modification: 'updateView',
				entityName: 'Author3',
				view: {
					sql: 'SELECT id, name FROM author2',
					dependencies: [
						'Author2',
					],
				},
			},
		],
		sql: SQL`CREATE OR REPLACE VIEW "author3" AS SELECT id, name FROM author2;`,
	}))

namespace ViewEntityUpdatedSchema4 {
	@def.View("SELECT null as id, 'Jack' AS name")
	export class Author {
		name = def.stringColumn()
	}

	@def.View('SELECT id, name FROM author', { dependencies: [Author] })
	export class Author2 {
		name = def.stringColumn()
	}

	@def.View('SELECT id, name FROM author2', { dependencies: [Author2] })
	export class Author3 {
		name = def.stringColumn()
	}
}

describe('update a view 4 - replace whole chain in dependency order', () =>
	testMigrations({
		original: createSchema(ViewEntityOriginalSchema),
		updated: createSchema(ViewEntityUpdatedSchema4),
		diff: [
			{
				modification: 'updateView',
				entityName: 'Author',
				view: {
					sql: "SELECT null as id, 'Jack' AS name",
				},
			},
			{
				modification: 'updateView',
				entityName: 'Author2',
				view: {
					sql: 'SELECT id, name FROM author',
					dependencies: [
						'Author',
					],
				},
			},
			{
				modification: 'updateView',
				entityName: 'Author3',
				view: {
					sql: 'SELECT id, name FROM author2',
					dependencies: [
						'Author2',
					],
				},
			},
		],
		sql: SQL`CREATE OR REPLACE VIEW "author" AS SELECT null as id, 'Jack' AS name;
CREATE OR REPLACE VIEW "author2" AS SELECT id, name FROM author;
CREATE OR REPLACE VIEW "author3" AS SELECT id, name FROM author2;`,
	}))

namespace MaterializedViewOriginalSchema {
	@def.View("SELECT null as id, 'John' AS name", { materialized: true })
	export class MatAuthor {
		name = def.stringColumn()
	}
}

namespace MaterializedViewUpdatedSchema {
	@def.View("SELECT null as id, 'Jack' AS name", { materialized: true })
	export class MatAuthor {
		name = def.stringColumn()
	}
}

// materialized views cannot be replaced in-place (no CREATE OR REPLACE MATERIALIZED VIEW) -> drop & recreate
describe('update a materialized view - still drops & recreates', () =>
	testMigrations({
		original: createSchema(MaterializedViewOriginalSchema),
		updated: createSchema(MaterializedViewUpdatedSchema),
		diff: [
			{
				modification: 'removeEntity',
				entityName: 'MatAuthor',
			},
			{
				modification: 'createView',
				entity: {
					name: 'MatAuthor',
					primary: 'id',
					primaryColumn: 'id',
					unique: [],
					indexes: [],
					fields: {
						id: {
							name: 'id',
							columnName: 'id',
							nullable: false,
							type: 'Uuid',
							columnType: 'uuid',
						},
						name: {
							name: 'name',
							columnName: 'name',
							nullable: true,
							type: 'String',
							columnType: 'text',
						},
					},
					tableName: 'mat_author',
					eventLog: {
						enabled: true,
					},
					view: {
						sql: "SELECT null as id, 'Jack' AS name",
						materialized: true,
					},
				},
			},
		],
		sql: SQL`DROP MATERIALIZED VIEW "mat_author";
CREATE MATERIALIZED VIEW "mat_author" AS SELECT null as id, 'Jack' AS name WITH DATA;`,
	}))

namespace AddViewColumnOriginalSchema {
	@def.View("SELECT null as id, 'John' AS name")
	export class Author {
		name = def.stringColumn()
	}

	@def.View('SELECT * FROM author', { dependencies: [Author] })
	export class Author2 {
		name = def.stringColumn()
	}
}

namespace AddViewColumnUpdatedSchema {
	@def.View("SELECT null as id, 'John' AS name, 0 AS age")
	export class Author {
		name = def.stringColumn()
		age = def.intColumn()
	}

	@def.View('SELECT * FROM author', { dependencies: [Author] })
	export class Author2 {
		name = def.stringColumn()
	}
}

// changing the output columns of a view requires a drop & recreate of it and its dependants
describe('add a column to a view - still cascades drop & recreate', () =>
	testMigrations({
		original: createSchema(AddViewColumnOriginalSchema),
		updated: createSchema(AddViewColumnUpdatedSchema),
		diff: [
			{
				modification: 'removeEntity',
				entityName: 'Author2',
			},
			{
				modification: 'removeEntity',
				entityName: 'Author',
			},
			{
				modification: 'createView',
				entity: {
					name: 'Author',
					primary: 'id',
					primaryColumn: 'id',
					unique: [],
					indexes: [],
					fields: {
						id: {
							name: 'id',
							columnName: 'id',
							nullable: false,
							type: 'Uuid',
							columnType: 'uuid',
						},
						name: {
							name: 'name',
							columnName: 'name',
							nullable: true,
							type: 'String',
							columnType: 'text',
						},
						age: {
							name: 'age',
							columnName: 'age',
							nullable: true,
							type: 'Integer',
							columnType: 'integer',
						},
					},
					tableName: 'author',
					eventLog: {
						enabled: true,
					},
					view: {
						sql: "SELECT null as id, 'John' AS name, 0 AS age",
					},
				},
			},
			{
				modification: 'createView',
				entity: {
					name: 'Author2',
					primary: 'id',
					primaryColumn: 'id',
					unique: [],
					indexes: [],
					fields: {
						id: {
							name: 'id',
							columnName: 'id',
							nullable: false,
							type: 'Uuid',
							columnType: 'uuid',
						},
						name: {
							name: 'name',
							columnName: 'name',
							nullable: true,
							type: 'String',
							columnType: 'text',
						},
					},
					tableName: 'author2',
					eventLog: {
						enabled: true,
					},
					view: {
						sql: 'SELECT * FROM author',
						dependencies: [
							'Author',
						],
					},
				},
			},
		],
		sql: SQL`DROP VIEW "author2";
DROP VIEW "author";
CREATE VIEW "author" AS SELECT null as id, 'John' AS name, 0 AS age;
CREATE VIEW "author2" AS SELECT * FROM author;`,
	}))
