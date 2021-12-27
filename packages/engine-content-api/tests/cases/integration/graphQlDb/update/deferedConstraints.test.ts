import { test } from 'uvu'
import { SchemaBuilder } from '@contember/schema-definition'
import { GQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'
import { executeDbTest } from '@contember/engine-api-tester'

test('delete without deferring constraints', async () => {
	await executeDbTest({
		schema: new SchemaBuilder()
			.entity('Post', entity =>
				entity
					.column('slug')
					.unique(['slug']),
			)
			.entity('Attachment', entity =>
				entity
					.column('slug')
					.manyHasOne('post', relation => relation.target('Post').inversedBy('attachments').notNull())
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
				transaction {
					ok
					errorMessage
					updatePost(by: {slug: "foo"}, data: {references: [{delete: {slug: "ref"}}], attachments: [{delete: {slug: "atta"}}]}) {
						ok
						errorMessage
					}
				}
			}
		`,
		return: {
			transaction: {
				ok: false,
				errorMessage: 'Execution has failed:\nupdatePost.attachments.0: NotFoundOrDenied (table reference)',
				updatePost: {
					ok: false,
					errorMessage: 'Execution has failed:\nattachments.0: NotFoundOrDenied (table reference)',
				},
			},
		},
	})
})


test('delete with successfully deferring constraints', async () => {
	await executeDbTest({
		schema: new SchemaBuilder()
			.entity('Post', entity =>
				entity
					.column('slug')
					.unique(['slug']),
			)
			.entity('Attachment', entity =>
				entity
					.column('slug')
					.manyHasOne('post', relation => relation.target('Post').inversedBy('attachments').notNull())
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
				transaction(options: {deferForeignKeyConstraints: true}) {
					ok
					errorMessage
					updatePost(by: {slug: "foo"}, data: {references: [{delete: {slug: "ref"}}], attachments: [{delete: {slug: "atta"}}]}) {
						ok
						errorMessage
					}
				}
			}
		`,
		return: {
			transaction: {
				ok: true,
				errorMessage: null,
				updatePost: {
					ok: true,
					errorMessage: null,
				},
			},
		},
	})
})


test('delete with unsuccessfully deferring constraints', async () => {
	await executeDbTest({
		schema: new SchemaBuilder()
			.entity('Post', entity =>
				entity
					.column('slug')
					.unique(['slug']),
			)
			.entity('Attachment', entity =>
				entity
					.column('slug')
					.manyHasOne('post', relation => relation.target('Post').inversedBy('attachments').notNull())
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
				transaction(options: {deferForeignKeyConstraints: true}) {
					ok
					errorMessage
					updatePost(by: {slug: "foo"}, data: {attachments: [{delete: {slug: "atta"}}]}) {
						ok
						errorMessage
					}
				}
			}
		`,
		return: {
			transaction: {
				ok: false,
				errorMessage: 'Execution has failed:\nunknown field: ForeignKeyConstraintViolation (update or delete on table "attachment" violates foreign key constraint "fk_reference_attachment_id_a5098e" on table "reference")',
				updatePost: {
					ok: false,
					errorMessage: null,
				},
			},
		},
	})
})


test.run()
