import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester.js'
import { AclDefinition as acl, createSchema, SchemaDefinition as def } from '@contember/schema-definition'

namespace Model {
	export const readerRole = acl.createRole('reader')
	export const companyVariable = acl.createEntityVariable('company', 'Company', readerRole)

	@acl.allow(readerRole, { read: true, when: { id: companyVariable } })
	export class Company {
		name = def.stringColumn()
		articles = def.oneHasMany(Article, 'owner')
		reviews = def.oneHasMany(Review, 'company')
	}

	// Article is readable purely by its owner company — INDEPENDENT of `review`.
	@acl.allow(readerRole, { read: true, when: { owner: { id: companyVariable } } })
	export class Article {
		title = def.stringColumn()
		owner = def.manyHasOne(Company, 'articles').notNull()
		review = def.oneHasOne(Review, 'article') // owning side: FK review_id on article
	}

	// Review is readable when its company matches — a FORWARD relation from Review.
	@acl.allow(readerRole, { read: true, when: { company: { id: companyVariable } } })
	export class Review {
		verdict = def.stringColumn()
		company = def.manyHasOne(Company, 'reviews').notNull()
		article = def.oneHasOneInverse(Article, 'review').notNull()
	}
}

// Regression: filtering a list by a to-one relation's `id` being null wrongly drops a
// parent row that is independently readable AND genuinely has no related row, when the
// target entity (Review) has a row-level read predicate referencing a further relation.
//
// The injected Review predicate (`review.company_id = ?`) is AND-ed into the outer WHERE
// over a LEFT JOIN whose columns are NULL for the absent review, so the row is excluded.
// (`visitOneHasMany` already handles this via `hasRootIsNull`; the to-one branch does not.)
test('ACL: isNull on a to-one relation wrongly excludes a readable parent with no related row', async () => {
	const tester = await createTester(createSchema(Model))

	const companyRes = await tester(gql`
		mutation {
			createCompany(data: { name: "Acme" }) {
				node {
					id
				}
			}
		}
	`).expect(200)
	const companyId = companyRes.body.data.createCompany.node.id

	await tester(
		gql`
			mutation ($owner: UUID!) {
				createArticle(data: { title: "No review yet", owner: { connect: { id: $owner } } }) {
					ok
				}
			}
		`,
		{ variables: { owner: companyId } },
	)
		.expect(response => {
			expect(response.body.data.createArticle.ok).toBe(true)
		})
		.expect(200)

	const email = `reader+${Date.now()}@doe.com`
	const identityId = await tester.tenant.signUp(email)
	const authKey = await tester.tenant.signIn(email)
	await tester.tenant.addProjectMember(identityId, tester.projectSlug, {
		role: 'reader',
		variables: [{ name: 'company', values: [companyId] }],
	})

	// sanity: the article IS readable (owner matches) — returned without any filter
	await tester(
		gql`
			query {
				listArticle {
					title
				}
			}
		`,
		{ authorizationToken: authKey },
	)
		.expect(response => {
			expect(response.body.data.listArticle).toStrictEqual([{ title: 'No review yet' }])
		})
		.expect(200)

	// core: the article has no review, so `review.id = null` MUST return it
	await tester(
		gql`
			query {
				listArticle(filter: { review: { id: { isNull: true } } }) {
					title
				}
			}
		`,
		{ authorizationToken: authKey },
	)
		.expect(response => {
			// EXPECTED: [{ title: 'No review yet' }]
			// ACTUAL (bug): []
			expect(response.body.data.listArticle).toStrictEqual([{ title: 'No review yet' }])
		})
		.expect(200)
})
