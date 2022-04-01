import { testMigrations } from '../../src/tests'
import { SQL } from '../../src/tags'
import { SchemaDefinition as def } from '@contember/schema-definition'

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


testMigrations('update a view 1', {
	originalSchema: def.createModel(ViewEntityOriginalSchema),
	updatedSchema: def.createModel(ViewEntityUpdatedSchema1),
	diff: [
		{
			modification: 'removeEntity',
			entityName: 'Author3',
		},
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
				unique: {},
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
				tableName: 'author',
				view: {
					sql: "SELECT null as id, 'Jack' AS name",
				},
				eventLog: {
					enabled: true,
				},
			},
		},
		{
			modification: 'createView',
			entity: {
				name: 'Author2',
				primary: 'id',
				primaryColumn: 'id',
				unique: {},
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
				view: {
					sql: 'SELECT * FROM author',
					dependencies: [
						'Author',
					],
				},
				eventLog: {
					enabled: true,
				},
			},
		},
		{
			modification: 'createView',
			entity: {
				name: 'Author3',
				primary: 'id',
				primaryColumn: 'id',
				unique: {},
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
				tableName: 'author3',
				view: {
					sql: 'SELECT * FROM author2',
					dependencies: [
						'Author2',
					],
				},
				eventLog: {
					enabled: true,
				},
			},
		},
	],
	sql: SQL`DROP VIEW "author3";
DROP VIEW "author2";
DROP VIEW "author";
CREATE VIEW "author" AS SELECT null as id, 'Jack' AS name;
CREATE VIEW "author2" AS SELECT * FROM author;
CREATE VIEW "author3" AS SELECT * FROM author2;`,
})


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

testMigrations('update a view 2', {
	originalSchema: def.createModel(ViewEntityOriginalSchema),
	updatedSchema: def.createModel(ViewEntityUpdatedSchema2),
	diff: [
		{
			modification: 'removeEntity',
			entityName: 'Author3',
		},
		{
			modification: 'removeEntity',
			entityName: 'Author2',
		},
		{
			modification: 'createView',
			entity: {
				name: 'Author2',
				primary: 'id',
				primaryColumn: 'id',
				unique: {},
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
				view: {
					sql: 'SELECT id, name FROM author',
					dependencies: [
						'Author',
					],
				},
				eventLog: {
					enabled: true,
				},
			},
		},
		{
			modification: 'createView',
			entity: {
				name: 'Author3',
				primary: 'id',
				primaryColumn: 'id',
				unique: {},
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
				tableName: 'author3',
				view: {
					sql: 'SELECT * FROM author2',
					dependencies: [
						'Author2',
					],
				},
				eventLog: {
					enabled: true,
				},
			},
		},
	],
	sql: SQL`DROP VIEW "author3";
DROP VIEW "author2";
CREATE VIEW "author2" AS SELECT id, name FROM author;
CREATE VIEW "author3" AS SELECT * FROM author2;
`,
})


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

testMigrations('update a view 3', {
	originalSchema: def.createModel(ViewEntityOriginalSchema),
	updatedSchema: def.createModel(ViewEntityUpdatedSchema3),
	diff: [
		{
			modification: 'removeEntity',
			entityName: 'Author3',
		},
		{
			modification: 'createView',
			entity: {
				name: 'Author3',
				primary: 'id',
				primaryColumn: 'id',
				unique: {},
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
				tableName: 'author3',
				view: {
					sql: 'SELECT id, name FROM author2',
					dependencies: [
						'Author2',
					],
				},
				eventLog: {
					enabled: true,
				},
			},
		},
	],
	sql: SQL`DROP VIEW "author3";
CREATE VIEW "author3" AS SELECT id, name FROM author2;`,
})


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

testMigrations('update a view 4', {
	originalSchema: def.createModel(ViewEntityOriginalSchema),
	updatedSchema: def.createModel(ViewEntityUpdatedSchema4),
	diff: [
		{
			modification: 'removeEntity',
			entityName: 'Author3',
		},
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
				unique: {},
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
				tableName: 'author',
				view: {
					sql: "SELECT null as id, 'Jack' AS name",
				},
				eventLog: {
					enabled: true,
				},
			},
		},
		{
			modification: 'createView',
			entity: {
				name: 'Author2',
				primary: 'id',
				primaryColumn: 'id',
				unique: {},
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
				view: {
					sql: 'SELECT id, name FROM author',
					dependencies: [
						'Author',
					],
				},
				eventLog: {
					enabled: true,
				},
			},
		},
		{
			modification: 'createView',
			entity: {
				name: 'Author3',
				primary: 'id',
				primaryColumn: 'id',
				unique: {},
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
				tableName: 'author3',
				view: {
					sql: 'SELECT id, name FROM author2',
					dependencies: [
						'Author2',
					],
				},
				eventLog: {
					enabled: true,
				},
			},
		},
	],
	sql: SQL`DROP VIEW "author3";
DROP VIEW "author2";
DROP VIEW "author";
CREATE VIEW "author" AS SELECT null as id, 'Jack' AS name;
CREATE VIEW "author2" AS SELECT id, name FROM author;
CREATE VIEW "author3" AS SELECT id, name FROM author2;`,
})
