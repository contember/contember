import { expect, test } from 'bun:test'
import { Acl } from '@contember/schema'
import { AclDefinition as acl, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { createTester, gql } from '../../src/tester.js'

type Tester = Awaited<ReturnType<typeof createTester>>

const createArticle = async (tester: Tester, data: Record<string, string>): Promise<string> => {
	const response = await tester(
		gql`
			mutation ($data: ArticleCreateInput!) {
				createArticle(data: $data) {
					ok
					node {
						id
					}
				}
			}
		`,
		{ variables: { data } },
	).expect(200)
	expect(response.body.data.createArticle.ok).toBe(true)
	return response.body.data.createArticle.node.id
}

const setState = async (tester: Tester, token: string, id: string, state: string): Promise<boolean> => {
	const response = await tester(
		gql`
			mutation ($id: UUID!, $state: String!) {
				updateArticle(by: { id: $id }, data: { state: $state }) {
					ok
				}
			}
		`,
		{ authorizationToken: token, variables: { id, state } },
	).expect(200)
	return response.body.data.updateArticle.ok
}

const getState = async (tester: Tester, id: string): Promise<string> => {
	const response = await tester(
		gql`
			query ($id: UUID!) {
				getArticle(by: { id: $id }) {
					state
				}
			}
		`,
		{ variables: { id } },
	).expect(200)
	return response.body.data.getArticle.state
}

const signInMember = async (tester: Tester, memberships: readonly Acl.Membership[]) => {
	const email = `transition_${Date.now()}_${Math.random().toString(36).slice(2)}@doe.com`
	const identityId = await tester.tenant.signUp(email)
	const token = await tester.tenant.signIn(email)
	await tester.tenant.addProjectMemberships(identityId, tester.projectSlug, memberships)
	return { identityId, token }
}

namespace StateMachineModel {
	export const editor = acl.createRole('editor')
	export const identity = acl.createPredefinedVariable('identity', 'identityID', editor)

	@acl.allow(editor, { read: true })
	@acl.allow(editor, { when: { _old: { state: { eq: 'draft' } }, _new: { state: { eq: 'review' } } }, update: ['state'] })
	@acl.allow(editor, { when: { _old: { state: { eq: 'review' } }, _new: { state: { in: ['draft', 'published'] } } }, update: ['state'] })
	@acl.allow(editor, { when: { owner: identity }, update: true })
	export class Article {
		state = def.stringColumn().notNull()
		owner = def.uuidColumn().notNull()
	}
}

test('ACL: a state machine of several transition rules plus an ownership rule', async () => {
	const tester = await createTester(createSchema(StateMachineModel))
	const { identityId, token } = await signInMember(tester, [{ role: 'editor', variables: [] }])
	const someoneElse = '00000000-0000-0000-0000-000000000001'
	const foreign = await createArticle(tester, { state: 'draft', owner: someoneElse })
	const skipping = await createArticle(tester, { state: 'draft', owner: someoneElse })
	const own = await createArticle(tester, { state: 'draft', owner: identityId })

	expect(await setState(tester, token, foreign, 'review')).toBe(true)
	expect(await setState(tester, token, foreign, 'published')).toBe(true)
	expect(await setState(tester, token, foreign, 'draft')).toBe(false)
	expect(await getState(tester, foreign)).toBe('published')

	// draft -> published combines the old part of one rule with the new part of another
	expect(await setState(tester, token, skipping, 'published')).toBe(false)
	expect(await getState(tester, skipping)).toBe('draft')

	expect(await setState(tester, token, own, 'published')).toBe(true)

	const meta = await tester(
		gql`
			query {
				listArticle(orderBy: [{ id: asc }]) {
					id
					_meta {
						state {
							updatable
						}
					}
				}
			}
		`,
		{ authorizationToken: token },
	).expect(200)
	const updatable = Object.fromEntries(
		meta.body.data.listArticle.map((it: { id: string; _meta: { state: { updatable: boolean } } }) => [it.id, it._meta.state.updatable]),
	)
	expect(updatable).toEqual({ [foreign]: false, [skipping]: true, [own]: true })
})

namespace TwoRolesModel {
	export const reviewer = acl.createRole('reviewer')
	export const publisher = acl.createRole('publisher')

	@acl.allow(reviewer, { read: true })
	@acl.allow(reviewer, { when: { _old: { state: { eq: 'draft' } }, _new: { state: { eq: 'review' } } }, update: ['state'] })
	@acl.allow(publisher, { read: true })
	@acl.allow(publisher, { when: { _old: { state: { eq: 'review' } }, _new: { state: { eq: 'published' } } }, update: ['state'] })
	export class Article {
		state = def.stringColumn().notNull()
	}
}

test('ACL: two roles cannot combine their transitions into one neither allows', async () => {
	const tester = await createTester(createSchema(TwoRolesModel))
	const { token } = await signInMember(tester, [{ role: 'reviewer', variables: [] }, { role: 'publisher', variables: [] }])
	const article = await createArticle(tester, { state: 'draft' })

	expect(await setState(tester, token, article, 'published')).toBe(false)
	expect(await getState(tester, article)).toBe('draft')

	expect(await setState(tester, token, article, 'review')).toBe(true)
	expect(await setState(tester, token, article, 'published')).toBe(true)
	expect(await getState(tester, article)).toBe('published')
})
