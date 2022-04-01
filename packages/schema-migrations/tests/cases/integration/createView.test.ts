import { testMigrations } from '../../src/tests.js'
import { SQL } from '../../src/tags.js'
import { SchemaDefinition as def } from '@contember/schema-definition'

namespace ViewEntityOriginalSchema {

	export class Author {
		name = def.stringColumn()
	}
}

namespace ViewEntityUpdatedSchema {
	export class Author {
		name = def.stringColumn()
		stats = def.oneHasOneInverse(AuthorStats, 'author')
	}

	@def.View('SELECT 1')
	export class AuthorStats {
		author = def.oneHasOne(Author, 'stats')
		articleCount = def.intColumn()
	}
}


testMigrations('create view', {
	originalSchema: def.createModel(ViewEntityOriginalSchema),
	updatedSchema: def.createModel(ViewEntityUpdatedSchema),
	diff: [
		{
			modification: 'createView',
			entity: {
				name: 'AuthorStats',
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
					author: {
						name: 'author',
						inversedBy: 'stats',
						nullable: true,
						type: 'OneHasOne',
						target: 'Author',
						joiningColumn: {
							columnName: 'author_id',
							onDelete: 'restrict',
						},
					},
					articleCount: {
						name: 'articleCount',
						columnName: 'article_count',
						nullable: true,
						type: 'Integer',
						columnType: 'integer',
					},
				},
				tableName: 'author_stats',
				view: {
					sql: 'SELECT 1',
				},
				eventLog: {
					enabled: true,
				},
			},
		},
		{
			modification: 'createRelationInverseSide',
			entityName: 'Author',
			relation: {
				name: 'stats',
				ownedBy: 'author',
				target: 'AuthorStats',
				type: 'OneHasOne',
				nullable: true,
			},
		},
	],
	sql: SQL`CREATE VIEW "author_stats" AS SELECT 1;`,
})

