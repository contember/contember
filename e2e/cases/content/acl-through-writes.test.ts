import { expect, test } from 'bun:test'
import { AclDefinition as acl, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { createTester, gql } from '../../src/tester.js'

namespace ThroughWritesModel {
	export const editor = acl.createRole('editor')

	@acl.allow(editor, { read: true, update: true })
	export class Article {
		title = def.stringColumn().notNull()
		images = def.oneHasMany(Image, 'article')
		tags = def.manyHasMany(Tag, 'articles')
	}

	@acl.allow(editor, { read: true, create: true, update: true, delete: true, through: true })
	export class Image {
		code = def.stringColumn().notNull().unique()
		label = def.stringColumn().notNull()
		article = def.manyHasOne(Article, 'images').notNull()
	}

	@acl.allow(editor, { read: true, create: true, update: true, delete: true, through: true })
	export class Tag {
		code = def.stringColumn().notNull().unique()
		articles = def.manyHasManyInverse(Article, 'tags')
	}
}

test('ACL: through permissions authorize nested writes but not root operations', async () => {
	const tester = await createTester(createSchema(ThroughWritesModel))
	const createArticle = await tester(gql`
		mutation {
			createArticle(data: { title: "Article" }) { node { id } }
		}
	`).expect(200)
	const articleId = createArticle.body.data.createArticle.node.id

	const email = `through-writes-${Date.now()}@example.com`
	const identityId = await tester.tenant.signUp(email)
	const authKey = await tester.tenant.signIn(email)
	await tester.tenant.addProjectMember(identityId, tester.projectSlug, { role: 'editor', variables: [] })

	await tester(
		gql`
		mutation ($id: UUID!) {
			updateArticle(
				by: { id: $id }
				data: {
					images: [{ create: { code: "hero", label: "Initial" } }]
					tags: [{ create: { code: "featured" } }]
				}
			) { ok }
		}
	`,
		{ authorizationToken: authKey, variables: { id: articleId } },
	).expect({ data: { updateArticle: { ok: true } } }).expect(200)

	await tester(
		gql`
		mutation ($id: UUID!) {
			updateArticle(
				by: { id: $id }
				data: { images: [{ update: { by: { code: "hero" }, data: { label: "Updated" } } }] }
			) { ok }
		}
	`,
		{ authorizationToken: authKey, variables: { id: articleId } },
	).expect({ data: { updateArticle: { ok: true } } }).expect(200)

	await tester(
		gql`
		query ($id: UUID!) {
			getArticle(by: { id: $id }) { images { code label } tags { code } }
		}
	`,
		{ authorizationToken: authKey, variables: { id: articleId } },
	)
		.expect({ data: { getArticle: { images: [{ code: 'hero', label: 'Updated' }], tags: [{ code: 'featured' }] } } })
		.expect(200)

	await tester(
		gql`
		mutation ($id: UUID!) {
			updateArticle(
				by: { id: $id }
				data: { images: [{ delete: { code: "hero" } }] }
			) { ok }
		}
	`,
		{ authorizationToken: authKey, variables: { id: articleId } },
	).expect({ data: { updateArticle: { ok: true } } }).expect(200)

	await tester(gql`query { listImage { id } listTag { id } }`, { authorizationToken: authKey })
		.expect(400)
		.expect(response => {
			expect(response.body.errors[0].message).toContain('Cannot query field "listImage"')
		})
})
