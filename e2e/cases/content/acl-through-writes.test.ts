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

namespace ConditionalThroughWritesModel {
	export const editor = acl.createRole('editor')

	@acl.allow(editor, { read: ['label', 'canManageChildren'], update: ['label', 'children'] })
	@acl.allow(editor, {
		when: { canManageChildren: { eq: true } },
		read: ['children', 'tags'],
		update: ['tags'],
	})
	export class ManagedParent {
		label = def.stringColumn().notNull()
		canManageChildren = def.boolColumn().notNull()
		children = def.oneHasMany(ManagedChild, 'parent')
		tags = def.manyHasMany(ManagedTag, 'parents')
	}

	@acl.allow(editor, {
		when: { parent: acl.canRead('children') },
		read: true,
		create: true,
		update: true,
		delete: true,
		through: true,
	})
	export class ManagedChild {
		code = def.stringColumn().notNull().unique()
		label = def.stringColumn().notNull()
		parent = def.manyHasOne(ManagedParent, 'children').notNull()
	}

	@acl.allow(editor, { read: true, update: true })
	export class ManagedTag {
		code = def.stringColumn().notNull().unique()
		label = def.stringColumn().notNull()
		parents = def.manyHasManyInverse(ManagedParent, 'tags')
	}
}

test('ACL: nested writes require the conditional parent predicate without an evaluated query witness', async () => {
	const tester = await createTester(createSchema(ConditionalThroughWritesModel))
	const seeded = await tester(gql`
		mutation {
			blocked: createManagedParent(data: {
				label: "Blocked"
				canManageChildren: false
				children: [{ create: { code: "blocked-child", label: "Before" } }]
			}) { node { id } }
			allowed: createManagedParent(data: { label: "Allowed", canManageChildren: true }) { node { id } }
			sharedTag: createManagedTag(data: { code: "shared-tag", label: "Shared" }) { node { id } }
		}
	`).expect(200)
	const blockedId = seeded.body.data.blocked.node.id
	const allowedId = seeded.body.data.allowed.node.id

	const email = `conditional-through-writes-${Date.now()}@example.com`
	const identityId = await tester.tenant.signUp(email)
	const authKey = await tester.tenant.signIn(email)
	await tester.tenant.addProjectMember(identityId, tester.projectSlug, { role: 'editor', variables: [] })

	await tester(
		gql`
			mutation ($id: UUID!) {
				updateManagedParent(by: { id: $id }, data: {
					children: [{ create: { code: "blocked-created", label: "Created" } }]
				}) { ok }
			}
		`,
		{ authorizationToken: authKey, variables: { id: blockedId } },
	).expect({ data: { updateManagedParent: { ok: false } } }).expect(200)

	await tester(
		gql`
			mutation ($id: UUID!) {
				updateManagedParent(by: { id: $id }, data: {
					children: [{ update: { by: { code: "blocked-child" }, data: { label: "Changed" } } }]
				}) { ok }
			}
		`,
		{ authorizationToken: authKey, variables: { id: blockedId } },
	).expect({ data: { updateManagedParent: { ok: false } } }).expect(200)

	await tester(
		gql`
			mutation ($id: UUID!) {
				updateManagedParent(by: { id: $id }, data: {
					children: [{ delete: { code: "blocked-child" } }]
				}) { ok }
			}
		`,
		{ authorizationToken: authKey, variables: { id: blockedId } },
	).expect({ data: { updateManagedParent: { ok: false } } }).expect(200)

	await tester(
		gql`
			mutation ($id: UUID!) {
				updateManagedParent(by: { id: $id }, data: {
					tags: [{ connect: { code: "shared-tag" } }]
				}) { ok }
			}
		`,
		{ authorizationToken: authKey, variables: { id: blockedId } },
	).expect({ data: { updateManagedParent: { ok: false } } }).expect(200)

	await tester(
		gql`
			mutation ($id: UUID!) {
				updateManagedParent(by: { id: $id }, data: {
					children: [{ create: { code: "allowed-child", label: "Initial" } }]
				}) { ok }
			}
		`,
		{ authorizationToken: authKey, variables: { id: allowedId } },
	).expect({ data: { updateManagedParent: { ok: true } } }).expect(200)

	await tester(
		gql`
			mutation ($id: UUID!) {
				updateManagedParent(by: { id: $id }, data: {
					children: [{ update: { by: { code: "allowed-child" }, data: { label: "Updated" } } }]
				}) { ok }
			}
		`,
		{ authorizationToken: authKey, variables: { id: allowedId } },
	).expect({ data: { updateManagedParent: { ok: true } } }).expect(200)

	await tester(
		gql`
			mutation ($id: UUID!) {
				updateManagedParent(by: { id: $id }, data: {
					children: [{ delete: { code: "allowed-child" } }]
					tags: [{ connect: { code: "shared-tag" } }]
				}) { ok }
			}
		`,
		{ authorizationToken: authKey, variables: { id: allowedId } },
	).expect({ data: { updateManagedParent: { ok: true } } }).expect(200)

	await tester(
		gql`
			query ($blockedId: UUID!, $allowedId: UUID!) {
				blocked: getManagedParent(by: { id: $blockedId }) {
					children { code label }
					tags { code }
				}
				allowed: getManagedParent(by: { id: $allowedId }) {
					children { code label }
					tags { code }
				}
			}
		`,
		{ variables: { blockedId, allowedId } },
	)
		.expect({
			data: {
				blocked: { children: [{ code: 'blocked-child', label: 'Before' }], tags: [] },
				allowed: { children: [], tags: [{ code: 'shared-tag' }] },
			},
		})
		.expect(200)
})
