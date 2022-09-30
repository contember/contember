import { testMigrations } from '../../src/tests'
import { SchemaBuilder, SchemaDefinition as def, createSchema } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'

testMigrations('update column definition', {
	originalSchema: new SchemaBuilder()
		.entity('Author', e =>
			e.column('name', c => c.type(Model.ColumnType.String)).column('registeredAt', c => c.type(Model.ColumnType.Date)),
		)
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Author', e =>
			e
				.column('name', c => c.type(Model.ColumnType.String))
				.column('registeredAt', c => c.type(Model.ColumnType.DateTime)),
		)
		.buildSchema(),
	diff: [
		{
			modification: 'updateColumnDefinition',
			entityName: 'Author',
			fieldName: 'registeredAt',
			definition: {
				type: Model.ColumnType.DateTime,
				columnType: 'timestamptz',
				nullable: true,
			},
		},
	],
	sql: SQL`ALTER TABLE "author"
		ALTER "registered_at" SET DATA TYPE timestamptz USING "registered_at"::timestamptz;`,
})

namespace ViewColDepOrig {
	export class Author {
		val = def.intColumn()
	}

	@def.View('SELECT * FROM author', {
		dependencies: [Author],
	})
	export class AuthorMetaX {

	}

	@def.View('SELECT * FROM author_meta_x', {
		dependencies: [AuthorMetaX],
	})
	export class AuthorMetaY {
	}
}

namespace ViewColDepUpdated {
	export class Author {
		val = def.stringColumn()
	}

	@def.View('SELECT * FROM author', {
		dependencies: [Author],
	})
	export class AuthorMetaX {

	}

	@def.View('SELECT * FROM author_meta_x', {
		dependencies: [AuthorMetaX],
	})
	export class AuthorMetaY {
	}
}

testMigrations('recreate view dependent on entity after changing column type', {
	originalSchema: createSchema(ViewColDepOrig).model,
	updatedSchema: createSchema(ViewColDepUpdated).model,
	diff: [{ modification: 'removeEntity', entityName: 'AuthorMetaY' }, {
		modification: 'removeEntity',
		entityName: 'AuthorMetaX',
	}, {
		modification: 'updateColumnDefinition',
		entityName: 'Author',
		fieldName: 'val',
		definition: { nullable: true, type: 'String', columnType: 'text' },
	}, {
		modification: 'createView',
		entity: {
			name: 'AuthorMetaX',
			primary: 'id',
			primaryColumn: 'id',
			unique: {},
			indexes: {},
			fields: {
				id: {
					name: 'id',
					columnName: 'id',
					nullable: false,
					type: 'Uuid',
					columnType: 'uuid',
				},
			},
			tableName: 'author_meta_x',
			eventLog: { enabled: true },
			view: { sql: 'SELECT * FROM author', dependencies: ['Author'] },
		},
	}, {
		modification: 'createView',
		entity: {
			name: 'AuthorMetaY',
			primary: 'id',
			primaryColumn: 'id',
			unique: {},
			indexes: {},
			fields: {
				id: {
					name: 'id',
					columnName: 'id',
					nullable: false,
					type: 'Uuid',
					columnType: 'uuid',
				},
			},
			tableName: 'author_meta_y',
			eventLog: { enabled: true },
			view: { sql: 'SELECT * FROM author_meta_x', dependencies: ['AuthorMetaX'] },
		},
	}],
	sql: SQL`DROP VIEW "author_meta_y";
DROP VIEW "author_meta_x";
ALTER TABLE "author"
  ALTER "val" SET DATA TYPE text USING "val"::text;
CREATE VIEW "author_meta_x" AS SELECT * FROM author;
CREATE VIEW "author_meta_y" AS SELECT * FROM author_meta_x;`,
})
