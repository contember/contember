import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester.js'
import { AclDefinition as acl, createSchema, SchemaDefinition as def } from '@contember/schema-definition'

// Regression for #895: filtering by a relation's `id` being null must not drop a parent row that is
// independently readable and genuinely has no related row, even when the target entity has a row-level
// read predicate that references a further relation (so the injected ACL predicate sits over a LEFT JOIN).
// The bug affected both to-one relations and has-many relations whose child ACL references a sibling.

namespace ToOneModel {
	export const readerRole = acl.createRole('reader')
	export const companyVariable = acl.createEntityVariable('company', 'Company', readerRole)

	@acl.allow(readerRole, { read: true, when: { id: companyVariable } })
	export class Company {
		name = def.stringColumn()
		articles = def.oneHasMany(Article, 'owner')
		reviews = def.oneHasMany(Review, 'company')
	}

	// Article is readable purely by its owner company — independent of `review`.
	@acl.allow(readerRole, { read: true, when: { owner: { id: companyVariable } } })
	export class Article {
		title = def.stringColumn()
		owner = def.manyHasOne(Company, 'articles').notNull()
		review = def.oneHasOne(Review, 'article')
	}

	// Review's read predicate references a FORWARD relation (company) — the injected predicate that
	// previously broke the LEFT-JOINed isNull filter.
	@acl.allow(readerRole, { read: true, when: { company: { id: companyVariable } } })
	export class Review {
		verdict = def.stringColumn()
		company = def.manyHasOne(Company, 'reviews').notNull()
		article = def.oneHasOneInverse(Article, 'review').notNull()
	}
}

test('isNull on a to-one relation returns a readable parent with no related row (#895)', async () => {
	const tester = await createTester(createSchema(ToOneModel))

	const companyId = (await tester(gql`
		mutation {
			createCompany(data: { name: "Acme" }) {
				node {
					id
				}
			}
		}
	`).expect(200)).body.data.createCompany.node.id

	// readable article with NO review
	await tester(
		gql`
			mutation ($owner: UUID!) {
				createArticle(data: { title: "No review yet", owner: { connect: { id: $owner } } }) {
					ok
				}
			}
		`,
		{ variables: { owner: companyId } },
	).expect(200)

	// readable article WITH a (readable) review — must NOT match isNull:true
	await tester(
		gql`
			mutation ($owner: UUID!, $reviewCompany: UUID!) {
				createArticle(
					data: {
						title: "Has review"
						owner: { connect: { id: $owner } }
						review: { create: { verdict: "ok", company: { connect: { id: $reviewCompany } } } }
					}
				) {
					ok
				}
			}
		`,
		{ variables: { owner: companyId, reviewCompany: companyId } },
	).expect(200)

	const email = `reader+${Date.now()}@doe.com`
	const identityId = await tester.tenant.signUp(email)
	const authKey = await tester.tenant.signIn(email)
	await tester.tenant.addProjectMember(identityId, tester.projectSlug, {
		role: 'reader',
		variables: [{ name: 'company', values: [companyId] }],
	})

	// sanity: both articles are readable (owner matches)
	await tester(
		gql`
			query {
				listArticle(orderBy: [{ title: asc }]) {
					title
				}
			}
		`,
		{ authorizationToken: authKey },
	)
		.expect(response => {
			expect(response.body.data.listArticle).toStrictEqual([{ title: 'Has review' }, { title: 'No review yet' }])
		})
		.expect(200)

	// core: only the article with no review matches — role-invariant with the implicit admin
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
			expect(response.body.data.listArticle).toStrictEqual([{ title: 'No review yet' }])
		})
		.expect(200)
})

namespace HasManyModel {
	export const readerRole = acl.createRole('reader')
	export const companyVariable = acl.createEntityVariable('company', 'Company', readerRole)

	@acl.allow(readerRole, { read: true, when: { id: companyVariable } })
	export class Company {
		name = def.stringColumn()
		articles = def.oneHasMany(Article, 'owner')
		tags = def.oneHasMany(Tag, 'company')
	}

	// Article is readable via a SIBLING relation (tag.company) — not via the parent `owner`. This is the
	// case the optimizer cannot eliminate, so the injected predicate previously broke the EXISTS subquery.
	@acl.allow(readerRole, { read: true, when: { tag: { company: { id: companyVariable } } } })
	export class Article {
		title = def.stringColumn()
		owner = def.manyHasOne(Company, 'articles').notNull()
		tag = def.manyHasOne(Tag, 'articles').notNull()
	}

	@acl.allow(readerRole, { read: true, when: { company: { id: companyVariable } } })
	export class Tag {
		label = def.stringColumn()
		company = def.manyHasOne(Company, 'tags').notNull()
		articles = def.oneHasMany(Article, 'tag')
	}
}

test('isNull on a has-many relation returns a readable parent with no children when child ACL references a sibling (#895)', async () => {
	const tester = await createTester(createSchema(HasManyModel))

	const companyId = (await tester(gql`
		mutation {
			createCompany(data: { name: "Acme" }) {
				node {
					id
				}
			}
		}
	`).expect(200)).body.data.createCompany.node.id
	// Acme has no articles → must match { articles: { id: { isNull: true } } }

	const email = `reader+${Date.now()}@doe.com`
	const identityId = await tester.tenant.signUp(email)
	const authKey = await tester.tenant.signIn(email)
	await tester.tenant.addProjectMember(identityId, tester.projectSlug, {
		role: 'reader',
		variables: [{ name: 'company', values: [companyId] }],
	})

	await tester(
		gql`
			query {
				listCompany(filter: { articles: { id: { isNull: true } } }) {
					name
				}
			}
		`,
		{ authorizationToken: authKey },
	)
		.expect(response => {
			expect(response.body.data.listCompany).toStrictEqual([{ name: 'Acme' }])
		})
		.expect(200)
})
