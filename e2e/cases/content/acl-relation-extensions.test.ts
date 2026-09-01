import { expect, test } from 'bun:test'
import { AclDefinition as acl, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { createTester, gql } from '../../src/tester.js'

namespace RelationExtensionAclModel {
	export const reader = acl.createRole('reader')

	@acl.allow(reader, { read: ['id', 'name', 'showLocales'] })
	@acl.allow(reader, { read: ['locales'], when: { showLocales: { eq: true } } })
	export class Post {
		name = def.stringColumn().notNull()
		showLocales = def.boolColumn().notNull()
		locales = def.oneHasMany(PostLocale, 'post')
	}

	@acl.allow(reader, { read: true })
	@def.Unique({ fields: ['locale', 'post'] })
	export class PostLocale {
		locale = def.stringColumn().notNull()
		title = def.stringColumn().notNull()
		post = def.manyHasOne(Post, 'locales').notNull()
	}
}

test('ACL: relation extensions honor the source relation predicate', async () => {
	const tester = await createTester(createSchema(RelationExtensionAclModel))

	await tester(gql`
		mutation {
			allowed: createPost(data: {
				name: "allowed"
				showLocales: true
				locales: [{ create: { locale: "cs", title: "Allowed" } }]
			}) { ok }
			denied: createPost(data: {
				name: "denied"
				showLocales: false
				locales: [{ create: { locale: "cs", title: "Denied" } }]
			}) { ok }
		}
	`).expect(200)

	const email = `relation-extensions-${Date.now()}@example.com`
	const identityId = await tester.tenant.signUp(email)
	const authKey = await tester.tenant.signIn(email)
	await tester.tenant.addProjectMember(identityId, tester.projectSlug, { role: 'reader', variables: [] })

	await tester(
		gql`
		query {
			listPost(orderBy: [{ name: asc }]) {
				name
				locales { title }
				paginateLocales { pageInfo { totalCount } edges { node { title } } }
				localesByLocale(by: { locale: "cs" }) { title }
			}
		}
	`,
		{ authorizationToken: authKey },
	)
		.expect(response => {
			expect(response.body.errors).toBeUndefined()
			expect(response.body.data).toStrictEqual({
				listPost: [
					{
						name: 'allowed',
						locales: [{ title: 'Allowed' }],
						paginateLocales: { pageInfo: { totalCount: 1 }, edges: [{ node: { title: 'Allowed' } }] },
						localesByLocale: { title: 'Allowed' },
					},
					{
						name: 'denied',
						locales: [],
						paginateLocales: { pageInfo: { totalCount: 0 }, edges: [] },
						localesByLocale: null,
					},
				],
			})
		})
		.expect(200)
})
