import { test } from 'bun:test'
import { c, createSchema } from '@contember/schema-definition'
import { createTester, gql } from '../../src/tester'

namespace CascadeFailModel {
	export class Post {
		slug = c.stringColumn().unique()
		locales = c.oneHasMany(PostLocale, 'post')
	}

	export class PostLocale {
		title = c.stringColumn()
		post = c.manyHasOne(Post, 'locales').notNull()
	}
}

test('fails when deleting entity without proper cascade', async () => {

	const tester = await createTester(createSchema(CascadeFailModel))
	const res = await tester(gql`mutation {
        createPost(data: {slug: "foo", locales: [{create: {title: "bar"}}]}) {
            ok
            node {
                id
				locales {id }
            }
        }
    }`)
		.expect(200)
	const postId = res.body.data.createPost.node.id
	const localeId = res.body.data.createPost.node.locales[0].id

	await tester(gql`
        mutation {
            deletePost(by: {slug: "foo"}) {
                errorMessage
                node {
                    id
                }
            }
        }`)
		.expect(200)
		.expect({
			data: {
				deletePost: {
					errorMessage: `Execution has failed:
unknown field: ForeignKeyConstraintViolation (Cannot delete ${postId} row(s) of entity Post, because it is still referenced from ${localeId} row(s) of entity PostLocale in relation post. OnDelete behaviour of this relation is set to "restrict". You might consider changing it to "setNull" or "cascade".)`,
					node: null,
				},
			},
		})
})


