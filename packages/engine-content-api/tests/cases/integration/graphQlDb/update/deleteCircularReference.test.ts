import { test } from 'uvu'
import { SchemaBuilder } from '@contember/schema-definition'
import { GQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'
import { executeDbTest } from '@contember/engine-api-tester'

test('the test David wanted me to write', async () => {
	await executeDbTest({
		schema: new SchemaBuilder()
			.entity('Post', entity =>
				entity
					.column('slug')
					// .oneHasMany('attachments', relation => relation.target('Attachment').ownedBy('post'))
					// .oneHasMany('references', relation => relation.target('References').ownedBy('post'))
					.unique(['slug']),
			)
			.entity('Attachment', entity =>
				entity
					.column('slug')
					.manyHasOne('post', relation => relation.target('Post').inversedBy('attachments').notNull())
					// .oneHasMany('refereces', relation => relation.target('Reference').ownedBy('attachment'))
					.unique(['slug']),
			)
			.entity('Reference', entity =>
				entity
					.column('slug')
					.manyHasOne('post', relation => relation.target('Post').inversedBy('references').notNull())
					.manyHasOne('attachment', relation => relation.target('Attachment').inversedBy('refereces'))
					.unique(['slug']),
			)
			.buildSchema(),
		seed: [
			{
				query: `mutation {
					createPost(data: {slug: "foo", attachments: [{create: {slug: "atta"}}]}) {
						ok
						node {
							id
						}
					}
				}`,
			},
			{
				query: `mutation {
					updatePost(by: {slug: "foo"}, data: {references: [{create: {slug: "ref", attachment: {connect: {slug: "atta"}}}}]}) {
						ok
					}
				}`,
			},
		],
		query: GQL`
			mutation {
				updatePost(by: {slug: "foo"}, data: {references: [{delete: {slug: "ref"}}], attachments: [{delete: {slug: "atta"}}]}) {
					ok
					errorMessage
				}
			}
		`,
		return: {
			updatePost: {
				ok: true,
				errorMessage: null,
			},
		},
	})
})

test.run()
