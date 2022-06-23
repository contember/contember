import { testMigrations } from '../../src/tests.js'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags.js'
import { SchemaBuilder } from '@contember/schema-definition'

testMigrations('create inverse side relation (post with locales)', {
	originalSchema: new SchemaBuilder()
		.entity('Post', e => e)
		.entity('PostLocale', e => e.manyHasOne('post', r => r.target('Post')))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Post', e => e)
		.entity('PostLocale', e => e.manyHasOne('post', r => r.target('Post').inversedBy('locales')))
		.buildSchema(),
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

testMigrations('create inverse side relation together with changing onDelete behaviour', {
	originalSchema: new SchemaBuilder()
		.entity('Post', e => e)
		.entity('PostLocale', e => e.manyHasOne('post', r => r.target('Post')))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Post', e => e)
		.entity('PostLocale', e =>
			e.manyHasOne('post', r => r.target('Post').inversedBy('locales').onDelete(Model.OnDelete.cascade)),
		)
		.buildSchema(),
	diff: [
		{
			modification: 'updateRelationOnDelete',
			entityName: 'PostLocale',
			fieldName: 'post',
			onDelete: 'cascade',
		},
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
