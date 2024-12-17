import { c, createSchema } from '@contember/schema-definition'
import { test } from 'bun:test'
import { createTester, gql } from '../../src/tester'


namespace Model {
	export class Post {
		slug = c.stringColumn().unique()
		attachments = c.oneHasMany(Attachment, 'post')
		references = c.oneHasMany(Reference, 'post')
	}

	export class Attachment {
		slug = c.stringColumn().unique()
		post = c.manyHasOne(Post, 'attachments').notNull()
		references = c.oneHasMany(Reference, 'attachment')
	}

	export class Reference {
		slug = c.stringColumn().unique()
		post = c.manyHasOne(Post, 'references').notNull()
		attachment = c.manyHasOne(Attachment, 'references')
	}

}

test('delete without deferring constraints', async () => {
	const tester = await createTester(createSchema(Model))

	const res1 = await tester(gql`mutation {
		createPost(data: {slug: "foo", attachments: {create: {slug: "atta"}}}) {
			ok
			node {
				id
				attachments {
					id
                }
            }
        }
    }`)
		.expect(200)

	const postId = res1.body.data.createPost.node.id
	const attachmentId = res1.body.data.createPost.node.attachments[0].id

	const res2 = await tester(gql`mutation {
		updatePost(by: {slug: "foo"}, data: {references: {create: {slug: "ref", attachment: {connect: {slug: "atta"}}}}}) {
			ok
			node {
				references {
					id
				}
			}
		}
	}`)
		.expect(200)

	const referenceId = res2.body.data.updatePost.node.references[0].id

	const res3 = await tester(gql`
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
	`)
		.expect(200)
		.expect({
			data: {
				transaction: {
					ok: false,
					errorMessage: `Execution has failed:
updatePost.attachments.0: ForeignKeyConstraintViolation (Cannot delete ${attachmentId} row(s) of entity Attachment, because it is still referenced from ${referenceId} row(s) of entity Reference in relation attachment. OnDelete behaviour of this relation is set to "restrict". You might consider changing it to "setNull" or "cascade".)`,
					updatePost: {
						ok: false,
						errorMessage: `Execution has failed:
attachments.0: ForeignKeyConstraintViolation (Cannot delete ${attachmentId} row(s) of entity Attachment, because it is still referenced from ${referenceId} row(s) of entity Reference in relation attachment. OnDelete behaviour of this relation is set to "restrict". You might consider changing it to "setNull" or "cascade".)`,
					},
				},
			},
		})
})


test('delete with successfully deferring constraints', async () => {
	const tester = await createTester(createSchema(Model))

	const res1 = await tester(gql`mutation {
		createPost(data: {slug: "foo", attachments: {create: {slug: "atta"}}}) {
			ok
			node {
				id
				attachments {
					id
                }
            }
        }
    }`)
		.expect(200)

	const postId = res1.body.data.createPost.node.id
	const attachmentId = res1.body.data.createPost.node.attachments[0].id

	const res2 = await tester(gql`mutation {
		updatePost(by: {slug: "foo"}, data: {references: {create: {slug: "ref", attachment: {connect: {slug: "atta"}}}}}) {
			ok
			node {
				references {
					id
				}
			}
		}
	}`)
		.expect(200)

	const referenceId = res2.body.data.updatePost.node.references[0].id

	const res3 = await tester(gql`
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
	`)
		.expect(200)
		.expect({
			data: {
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
	const tester = await createTester(createSchema(Model))

	const res1 = await tester(gql`mutation {
		createPost(data: {slug: "foo", attachments: {create: {slug: "atta"}}}) {
			ok
			node {
				id
				attachments {
					id
                }
            }
        }
    }`)
		.expect(200)

	const postId = res1.body.data.createPost.node.id
	const attachmentId = res1.body.data.createPost.node.attachments[0].id

	const res2 = await tester(gql`mutation {
		updatePost(by: {slug: "foo"}, data: {references: {create: {slug: "ref", attachment: {connect: {slug: "atta"}}}}}) {
			ok
			node {
				references {
					id
				}
			}
		}
	}`)
		.expect(200)

	const referenceId = res2.body.data.updatePost.node.references[0].id

	const res3 = await tester(gql`
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
	`)
		.expect(200)
		.expect({
			data: {
				transaction: {
					ok: false,
					errorMessage: `Execution has failed:
unknown field: ForeignKeyConstraintViolation (Cannot delete row ${attachmentId} of entity Attachment, because it is still referenced from Reference::attachment. This is possibly caused by ACL denial or by missing \"on delete cascade\")`,
					updatePost: {
						ok: true,
						errorMessage: null,
					},
				},
			},
		})
})



