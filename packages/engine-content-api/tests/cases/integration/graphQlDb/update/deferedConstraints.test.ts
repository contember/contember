import { test } from 'vitest'
import { SchemaBuilder } from '@contember/schema-definition'
import { GQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'
import { executeDbTest } from '@contember/engine-api-tester'

test('delete without deferring constraints', async () => {
	await executeDbTest({
		schema: { model: new SchemaBuilder()
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
			.buildSchema() },
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
				errorMessage: 'Execution has failed:\nupdatePost.attachments.0: ForeignKeyConstraintViolation (Cannot delete 123e4567-e89b-12d3-a456-000000000002 row(s) of entity Attachment, because it is still referenced from 123e4567-e89b-12d3-a456-000000000003 row(s) of entity Reference in relation attachment. OnDelete behaviour of this relation is set to "restrict". You might consider changing it to "setNull" or "cascade".)',
				updatePost: {
					ok: false,
					errorMessage: 'Execution has failed:\nattachments.0: ForeignKeyConstraintViolation (Cannot delete 123e4567-e89b-12d3-a456-000000000002 row(s) of entity Attachment, because it is still referenced from 123e4567-e89b-12d3-a456-000000000003 row(s) of entity Reference in relation attachment. OnDelete behaviour of this relation is set to "restrict". You might consider changing it to "setNull" or "cascade".)',
				},
			},
		},
	})
})


test('delete with successfully deferring constraints', async () => {
	await executeDbTest({
		schema: { model: new SchemaBuilder()
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
			.buildSchema() },
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
		schema: { model: new SchemaBuilder()
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
			.buildSchema() },
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
				errorMessage: 'Execution has failed:\nunknown field: ForeignKeyConstraintViolation (Cannot delete row 123e4567-e89b-12d3-a456-000000000002 of entity Attachment, because it is still referenced from Reference::attachment. This is possibly caused by ACL denial or by missing "on delete cascade")',
				updatePost: {
					ok: false,
					errorMessage: null,
				},
			},
		},
	})
})



