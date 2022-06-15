import { assert, test } from 'vitest'
import { createTester, gql } from '../src/tester'
import { createSchema, SchemaDefinition as def, AclDefinition as acl } from '@contember/schema-definition'
import { addProjectMember, signIn, signUp } from '../src/requests'

namespace ArticleModel {
	export const readerRole = acl.createRole('reader')
	export const subscriptionVariable = acl.createConditionVariable('subscription', readerRole)

	@acl.allow(readerRole, {
		read: true,
		when: {
			publishedAt: subscriptionVariable,
		},
	})
	export class Article {
		publishedAt = def.dateTimeColumn().notNull()
	}
}

test('ACL: condition variable', async () => {
	const tester = await createTester(createSchema(ArticleModel))

	await tester(
		gql`
			mutation {
				articleA: createArticle(data: { publishedAt: "2022-02-01" }) {
					ok
				}
				articleB: createArticle(data: { publishedAt: "2021-12-01" }) {
					ok
				}
			}
		`,
	)
		.expect(response => {
			assert.deepStrictEqual(response.body.data, {
				articleA: {
					ok: true,
				},
				articleB: {
					ok: true,
				},
			})
		})
		.expect(200)


	const email = `john+${Date.now()}@doe.com`
	const identityId = await signUp(email)
	const authKey = await signIn(email)
	await addProjectMember(identityId, tester.projectSlug, { role: 'reader', variables: [{ name: 'subscription', values: [JSON.stringify({ gte: '2022-01-01' })] }] })

	await tester(
		gql`
			query {
				listArticle {
					publishedAt
				}
			}
		`,
		{ authorizationToken: authKey },
	)
		.expect(response => {
			assert.deepStrictEqual(response.body.data, {
				listArticle: [
					{
						publishedAt: '2022-02-01T00:00:00.000Z',
					},
				],
			})
		})
		.expect(200)
})
