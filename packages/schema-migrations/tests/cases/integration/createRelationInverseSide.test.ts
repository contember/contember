import { testMigrations } from '../../src/tests'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'

testMigrations('create inverse side relation (post with locales)', {
	originalSchema: {
		entities: {
			Post: {
				name: 'Post',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'post',
				fields: {},
				unique: {},
			},
			PostLocale: {
				name: 'PostLocale',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'post_locale',
				fields: {
					post: {
						name: 'post',
						type: Model.RelationType.ManyHasOne,
						target: 'Post',
						joiningColumn: {
							columnName: 'post_id',
							onDelete: Model.OnDelete.restrict,
						},
						nullable: true,
					},
				},
				unique: {},
			},
		},
		enums: {},
	},
	updatedSchema: {
		entities: {
			Post: {
				name: 'Post',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'post',
				fields: {
					locales: {
						name: 'locales',
						type: Model.RelationType.OneHasMany,
						target: 'PostLocale',
						ownedBy: 'post',
					},
				},
				unique: {},
			},
			PostLocale: {
				name: 'PostLocale',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'post_locale',
				fields: {
					post: {
						inversedBy: 'locales',
						name: 'post',
						type: Model.RelationType.ManyHasOne,
						target: 'Post',
						joiningColumn: {
							columnName: 'post_id',
							onDelete: Model.OnDelete.restrict,
						},
						nullable: true,
					},
				},
				unique: {},
			},
		},
		enums: {},
	},
	diff: [
		{
			modification: 'createRelationInverseSide',
			entityName: 'Post',
			relation: {
				name: 'locales',
				type: Model.RelationType.OneHasMany,
				target: 'PostLocale',
				ownedBy: 'post',
			},
		},
	],
	sql: SQL``,
})
