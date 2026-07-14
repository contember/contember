import { expect, test } from 'bun:test'
import { createTester, gql, rootToken } from '../../src/tester.js'
import { AclDefinition as acl, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import type { Schema } from '@contember/schema'

// Metamorphic "leak-oracle" safety net for the ACL read-path hardening.
//
// Invariant: a value a restricted role cannot read must never influence what a query returns.
// For a fixed schema + role we build TWO dataset states that differ ONLY in data the role cannot
// read (masked cell values, or entire rows the role cannot see). Running an identical query set as
// the restricted role against both states MUST yield byte-identical responses (order, presence,
// counts, _meta, everything). If they differ, an unreadable value leaked.
//
// Each pair has teeth: the same mutation is ALSO observed as root (unrestricted), whose view MUST
// differ between the two states — proving the mutated data is genuinely output-changing, so the
// pair is not vacuous.
//
// Dataset B is reached by mutating dataset A in place (same project, stable row ids) touching ONLY
// unreadable data. Stable ids make the metamorphic equality exact (a broken guard that ordered by /
// filtered on the masked value would order/filter differently between A and B and be caught).

type Query = { query: string; variables?: Record<string, any> }
type MembershipVar = { name: string; values: string[] }

const run = async (tester: any, token: string | undefined, queries: Query[]): Promise<any[]> => {
	const out: any[] = []
	for (const q of queries) {
		const res = await tester(q.query, { authorizationToken: token, variables: q.variables }).expect(200)
		out.push(res.body.data)
	}
	return out
}

interface OracleConfig {
	schema: Schema
	role: string
	/** create dataset A as root; return the role's membership variables + a ctx handed to mutateToB */
	setupA: (tester: any) => Promise<{ variables: MembershipVar[]; ctx: any }>
	/** mutate ONLY unreadable data (as root) to reach dataset B */
	mutateToB: (tester: any, ctx: any) => Promise<void>
	/** run as the restricted role; MUST be byte-identical across A and B */
	restrictedQueries: Query[]
	/** run as root; MUST differ across A and B (teeth — the mutated data really changes output) */
	teethQueries: Query[]
}

const assertLeakOracle = async (cfg: OracleConfig) => {
	const tester = await createTester(cfg.schema)
	const { variables, ctx } = await cfg.setupA(tester)

	const email = `leak_${cfg.role}_${Date.now()}_${Math.random().toString(36).slice(2)}@doe.com`
	const identityId = await tester.tenant.signUp(email)
	const authKey = await tester.tenant.signIn(email)
	await tester.tenant.addProjectMember(identityId, tester.projectSlug, { role: cfg.role, variables })

	const restrictedA = await run(tester, authKey, cfg.restrictedQueries)
	const teethA = await run(tester, rootToken, cfg.teethQueries)

	await cfg.mutateToB(tester, ctx)

	const restrictedB = await run(tester, authKey, cfg.restrictedQueries)
	const teethB = await run(tester, rootToken, cfg.teethQueries)

	// metamorphic invariant: restricted output cannot depend on unreadable data
	expect(restrictedB, 'LEAK: restricted-role output changed with only-unreadable data (A != B)').toStrictEqual(restrictedA)
	// teeth: the mutated data genuinely changes output (root sees the difference)
	expect(teethB, 'VACUOUS: root output identical across datasets — pair has no teeth').not.toStrictEqual(teethA)

	return { tester, authKey, restrictedA, teethA, teethB }
}

// ---- small create/update helpers ------------------------------------------------------------

// NB: plain template strings (not the `gql` tag, which forbids interpolation).
const create = async (tester: any, entity: string, data: Record<string, any>): Promise<string> => {
	const res = await tester(
		`mutation ($data: ${entity}CreateInput!) { create${entity}(data: $data) { ok errorMessage node { id } } }`,
		{ variables: { data } },
	).expect(200)
	const payload = res.body.data[`create${entity}`]
	expect(payload.ok, `create${entity} failed: ${payload.errorMessage}`).toBe(true)
	return payload.node.id
}

const update = async (tester: any, entity: string, id: string, data: Record<string, any>): Promise<void> => {
	const res = await tester(
		`mutation ($by: ${entity}UniqueWhere!, $data: ${entity}UpdateInput!) { update${entity}(by: $by, data: $data) { ok errorMessage } }`,
		{ variables: { by: { id }, data } },
	).expect(200)
	expect(res.body.data[`update${entity}`].ok, `update${entity} failed`).toBe(true)
}

const connect = (id: string) => ({ connect: { id } })

// =============================================================================================
// CLASS 1: order-by on a cell-level field (field read predicate stricter than the row predicate)
// =============================================================================================
namespace C1 {
	export const reader = acl.createRole('reader')
	export const companyVar = acl.createEntityVariable('company', 'Company', reader)

	@acl.allow(reader, { read: ['id', 'name'], when: { id: companyVar } })
	export class Company {
		name = def.stringColumn()
		items = def.oneHasMany(Item, 'company')
	}

	// Row (id/name) readable when in the company; `sortKey` readable only when elevated=yes → stricter,
	// so for the test rows (elevated=no) the sort key is masked (NULL) for the role.
	@acl.allow(reader, { read: ['id', 'name', 'company'], when: { company: { id: companyVar } } })
	@acl.allow(reader, { read: ['sortKey'], when: { company: { id: companyVar }, elevated: { eq: 'yes' } } })
	export class Item {
		name = def.stringColumn()
		sortKey = def.intColumn()
		elevated = def.stringColumn()
		company = def.manyHasOne(Company, 'items').notNull()
	}
}

test('CLASS 1 — order-by on a cell-level field: masked sort key cannot influence order', async () => {
	const { restrictedA, teethA, teethB } = await assertLeakOracle({
		schema: createSchema(C1),
		role: 'reader',
		setupA: async t => {
			const company = await create(t, 'Company', { name: 'Acme' })
			const a = await create(t, 'Item', { name: 'a', elevated: 'no', sortKey: 1, company: connect(company) })
			const b = await create(t, 'Item', { name: 'b', elevated: 'no', sortKey: 2, company: connect(company) })
			const c = await create(t, 'Item', { name: 'c', elevated: 'no', sortKey: 3, company: connect(company) })
			return { variables: [{ name: 'company', values: [company] }], ctx: { a, b, c } }
		},
		// permute the (unreadable) sort keys: 1,2,3 -> 3,2,1
		mutateToB: async (t, ctx) => {
			await update(t, 'Item', ctx.a, { sortKey: 3 })
			await update(t, 'Item', ctx.c, { sortKey: 1 })
		},
		// masked sortKey ties → fall back to readable name; must stay [a,b,c] regardless of sortKey
		restrictedQueries: [{
			query: gql`query { listItem(orderBy: [{ sortKey: asc }, { name: asc }]) { name sortKey } }`,
		}, {
			query: gql`query { listItem(filter: { or: [{ sortKey: { eq: 1 } }, { name: { eq: "a" } }] }) { name } }`,
		}],
		// root orders by the real sortKey → order flips when it is permuted
		teethQueries: [{ query: gql`query { listItem(orderBy: [{ sortKey: asc }]) { name } }` }],
	})

	// the masked cell is genuinely null for the role, yet the row is readable
	expect(restrictedA[0].listItem).toStrictEqual([
		{ name: 'a', sortKey: null },
		{ name: 'b', sortKey: null },
		{ name: 'c', sortKey: null },
	])
	// The public OR branch must not inherit the unreadable sortKey branch's cell guard.
	expect(restrictedA[1].listItem).toStrictEqual([{ name: 'a' }])
	// teeth spelled out: root order really flips
	expect(teethA[0].listItem.map((i: any) => i.name)).toStrictEqual(['a', 'b', 'c'])
	expect(teethB[0].listItem.map((i: any) => i.name)).toStrictEqual(['c', 'b', 'a'])
})

// =============================================================================================
// CLASS 2a: order-by THROUGH a relation — masked target column (Author.name cell-masked)
// =============================================================================================
namespace C2a {
	export const reader = acl.createRole('reader')
	export const companyVar = acl.createEntityVariable('company', 'Company', reader)

	@acl.allow(reader, { read: ['id', 'name'], when: { id: companyVar } })
	export class Company {
		name = def.stringColumn()
		posts = def.oneHasMany(Post, 'company')
		authors = def.oneHasMany(Author, 'company')
	}

	@acl.allow(reader, { read: ['id', 'title', 'company', 'author'], when: { company: { id: companyVar } } })
	export class Post {
		title = def.stringColumn()
		company = def.manyHasOne(Company, 'posts').notNull()
		author = def.manyHasOne(Author).notNull()
	}

	// Author row is readable (in the company), but `name` is masked unless active=yes → cell-level.
	@acl.allow(reader, { read: ['id', 'company'], when: { company: { id: companyVar } } })
	@acl.allow(reader, { read: ['name'], when: { company: { id: companyVar }, active: { eq: 'yes' } } })
	export class Author {
		name = def.stringColumn()
		active = def.stringColumn()
		company = def.manyHasOne(Company, 'authors').notNull()
	}
}

test('CLASS 2a — order-by through a relation: masked target column cannot influence order', async () => {
	const { restrictedA, teethA, teethB } = await assertLeakOracle({
		schema: createSchema(C2a),
		role: 'reader',
		setupA: async t => {
			const company = await create(t, 'Company', { name: 'Acme' })
			const a1 = await create(t, 'Author', { name: 'a', active: 'no', company: connect(company) })
			const a2 = await create(t, 'Author', { name: 'b', active: 'no', company: connect(company) })
			const a3 = await create(t, 'Author', { name: 'c', active: 'no', company: connect(company) })
			await create(t, 'Post', { title: 't1', company: connect(company), author: connect(a1) })
			await create(t, 'Post', { title: 't2', company: connect(company), author: connect(a2) })
			await create(t, 'Post', { title: 't3', company: connect(company), author: connect(a3) })
			return { variables: [{ name: 'company', values: [company] }], ctx: { a1, a3 } }
		},
		mutateToB: async (t, ctx) => {
			await update(t, 'Author', ctx.a1, { name: 'c' })
			await update(t, 'Author', ctx.a3, { name: 'a' })
		},
		restrictedQueries: [{
			query: gql`query { listPost(orderBy: [{ author: { name: asc } }, { title: asc }]) { title } }`,
		}, {
			query: gql`query { listPost(
				filter: { author: { or: [{ name: { eq: "a" } }, { id: { isNull: false } }] } }
				orderBy: [{ title: asc }]
			) { title } }`,
		}],
		teethQueries: [{ query: gql`query { listPost(orderBy: [{ author: { name: asc } }, { title: asc }]) { title } }` }],
	})
	expect(restrictedA[1].listPost).toStrictEqual([{ title: 't1' }, { title: 't2' }, { title: 't3' }])
	expect(teethA[0].listPost.map((p: any) => p.title)).toStrictEqual(['t1', 't2', 't3'])
	expect(teethB[0].listPost.map((p: any) => p.title)).toStrictEqual(['t3', 't2', 't1'])
})

// =============================================================================================
// CLASS 2b: order-by THROUGH a relation — masked hop (Post.author relation cell-masked)
// The linked author is hidden for unpublished posts; the (public) author name must not leak via order.
// =============================================================================================
namespace C2b {
	export const reader = acl.createRole('reader')
	export const companyVar = acl.createEntityVariable('company', 'Company', reader)

	@acl.allow(reader, { read: ['id', 'name'], when: { id: companyVar } })
	export class Company {
		name = def.stringColumn()
		posts = def.oneHasMany(Post, 'company')
		authors = def.oneHasMany(Author, 'company')
	}

	// Row readable in the company; the `author` HOP is masked unless published=yes → cell-level relation.
	@acl.allow(reader, { read: ['id', 'title', 'company'], when: { company: { id: companyVar } } })
	@acl.allow(reader, { read: ['author'], when: { company: { id: companyVar }, published: { eq: 'yes' } } })
	export class Post {
		title = def.stringColumn()
		published = def.stringColumn()
		company = def.manyHasOne(Company, 'posts').notNull()
		author = def.manyHasOne(Author).notNull()
	}

	// Author (incl. name) is fully readable within the company; only the LINK from a post is hidden.
	@acl.allow(reader, { read: ['id', 'name', 'company'], when: { company: { id: companyVar } } })
	export class Author {
		name = def.stringColumn()
		company = def.manyHasOne(Company, 'authors').notNull()
	}
}

test('CLASS 2b — order-by through a masked relation hop: hidden link cannot influence order', async () => {
	const { teethA, teethB } = await assertLeakOracle({
		schema: createSchema(C2b),
		role: 'reader',
		setupA: async t => {
			const company = await create(t, 'Company', { name: 'Acme' })
			const a1 = await create(t, 'Author', { name: 'a', company: connect(company) })
			const a2 = await create(t, 'Author', { name: 'b', company: connect(company) })
			const a3 = await create(t, 'Author', { name: 'c', company: connect(company) })
			const p1 = await create(t, 'Post', { title: 't1', published: 'no', company: connect(company), author: connect(a1) })
			const p2 = await create(t, 'Post', { title: 't2', published: 'no', company: connect(company), author: connect(a2) })
			const p3 = await create(t, 'Post', { title: 't3', published: 'no', company: connect(company), author: connect(a3) })
			return { variables: [{ name: 'company', values: [company] }], ctx: { p1, p3, a1, a3 } }
		},
		// permute the hidden post->author links (unreadable via the masked hop); author names stay fixed
		mutateToB: async (t, ctx) => {
			await update(t, 'Post', ctx.p1, { author: connect(ctx.a3) })
			await update(t, 'Post', ctx.p3, { author: connect(ctx.a1) })
		},
		restrictedQueries: [{ query: gql`query { listPost(orderBy: [{ author: { name: asc } }, { title: asc }]) { title } }` }],
		teethQueries: [{ query: gql`query { listPost(orderBy: [{ author: { name: asc } }, { title: asc }]) { title } }` }],
	})
	expect(teethA[0].listPost.map((p: any) => p.title)).toStrictEqual(['t1', 't2', 't3'])
	expect(teethB[0].listPost.map((p: any) => p.title)).toStrictEqual(['t3', 't2', 't1'])
})

// =============================================================================================
// CLASS 3: order-by on a many-has-many relation target (junction-fetch path), masked target column
// =============================================================================================
namespace C3 {
	export const reader = acl.createRole('reader')
	export const companyVar = acl.createEntityVariable('company', 'Company', reader)

	@acl.allow(reader, { read: ['id', 'name'], when: { id: companyVar } })
	export class Company {
		name = def.stringColumn()
		posts = def.oneHasMany(Post, 'company')
		tags = def.oneHasMany(Tag, 'company')
	}

	@acl.allow(reader, { read: ['id', 'title', 'company', 'tags'], when: { company: { id: companyVar } } })
	export class Post {
		title = def.stringColumn()
		company = def.manyHasOne(Company, 'posts').notNull()
		tags = def.manyHasMany(Tag)
	}

	// Tag row + label readable; `name` masked unless visible=yes → cell-level on the junction fetch.
	@acl.allow(reader, { read: ['id', 'label', 'company'], when: { company: { id: companyVar } } })
	@acl.allow(reader, { read: ['name'], when: { company: { id: companyVar }, visible: { eq: 'yes' } } })
	export class Tag {
		label = def.stringColumn()
		name = def.stringColumn()
		visible = def.stringColumn()
		company = def.manyHasOne(Company, 'tags').notNull()
	}
}

test('CLASS 3 — order-by on a many-has-many junction fetch: masked target column cannot influence order', async () => {
	const { teethA, teethB } = await assertLeakOracle({
		schema: createSchema(C3),
		role: 'reader',
		setupA: async t => {
			const company = await create(t, 'Company', { name: 'Acme' })
			const t1 = await create(t, 'Tag', { label: 'l1', name: 'a', visible: 'no', company: connect(company) })
			const t2 = await create(t, 'Tag', { label: 'l2', name: 'b', visible: 'no', company: connect(company) })
			const t3 = await create(t, 'Tag', { label: 'l3', name: 'c', visible: 'no', company: connect(company) })
			await create(t, 'Post', { title: 'p', company: connect(company), tags: [connect(t1), connect(t2), connect(t3)] })
			return { variables: [{ name: 'company', values: [company] }], ctx: { t1, t3 } }
		},
		mutateToB: async (t, ctx) => {
			await update(t, 'Tag', ctx.t1, { name: 'c' })
			await update(t, 'Tag', ctx.t3, { name: 'a' })
		},
		restrictedQueries: [{ query: gql`query { listPost { title tags(orderBy: [{ name: asc }], limit: 2) { label } } }` }],
		teethQueries: [{ query: gql`query { listPost { title tags(orderBy: [{ name: asc }], limit: 2) { label } } }` }],
	})
	// root's top-2 tags by real name flips (a,b -> a is now t3); role's stays stable
	expect(teethA[0].listPost[0].tags.map((x: any) => x.label)).toStrictEqual(['l1', 'l2'])
	expect(teethB[0].listPost[0].tags.map((x: any) => x.label)).toStrictEqual(['l3', 'l2'])
})

// =============================================================================================
// CLASS 4: isNull-absence on a relation — a present-but-unreadable related row must look absent
// =============================================================================================
namespace C4 {
	export const reader = acl.createRole('reader')
	export const companyVar = acl.createEntityVariable('company', 'Company', reader)

	@acl.allow(reader, { read: ['id', 'name', 'articles'], when: { id: companyVar } })
	export class Company {
		name = def.stringColumn()
		articles = def.oneHasMany(Article, 'owner')
	}

	// Article readable only when its owner is in scope AND visible=yes → a visible=no article is an
	// entirely unreadable row.
	@acl.allow(reader, { read: ['id', 'title', 'owner'], when: { owner: { id: companyVar }, visible: { eq: 'yes' } } })
	export class Article {
		title = def.stringColumn()
		visible = def.stringColumn()
		owner = def.manyHasOne(Company, 'articles').notNull()
	}
}

test('CLASS 4 — isNull-absence on a relation: present-but-unreadable child looks absent', async () => {
	const { restrictedA, teethA, teethB } = await assertLeakOracle({
		schema: createSchema(C4),
		role: 'reader',
		setupA: async t => {
			const acme = await create(t, 'Company', { name: 'Acme' }) // no readable article → matches isNull:true
			const beta = await create(t, 'Company', { name: 'Beta' })
			await create(t, 'Article', { title: 'pub', visible: 'yes', owner: connect(beta) }) // Beta has a readable article
			return { variables: [{ name: 'company', values: [acme, beta] }], ctx: { acme } }
		},
		// add a present-but-UNREADABLE article to Acme (visible=no)
		mutateToB: async (t, ctx) => {
			await create(t, 'Article', { title: 'hidden', visible: 'no', owner: connect(ctx.acme) })
		},
		restrictedQueries: [{ query: gql`query { listCompany(filter: { articles: { id: { isNull: true } } }, orderBy: [{ name: asc }]) { name } }` }],
		teethQueries: [{ query: gql`query { listCompany(filter: { articles: { id: { isNull: true } } }, orderBy: [{ name: asc }]) { name } }` }],
	})
	// role: Acme always matches (no readable article); Beta never (has a readable one)
	expect(restrictedA[0].listCompany).toStrictEqual([{ name: 'Acme' }])
	// teeth: root sees the hidden article appear on Acme → Acme drops out of isNull:true
	expect(teethA[0].listCompany).toStrictEqual([{ name: 'Acme' }])
	expect(teethB[0].listCompany).toStrictEqual([])
})

// =============================================================================================
// CLASS 5: to-many back-reference filter oracle — an unreadable sibling's value must not leak
// listDoc(filter: { owner: { docs: { secret: { eq: PROBE } } } }) — `owner.docs` is a to-many back-hop.
// =============================================================================================
namespace C5 {
	export const reader = acl.createRole('reader')
	export const companyVar = acl.createEntityVariable('company', 'Team', reader)

	@acl.allow(reader, { read: ['id', 'name', 'docs'], when: { id: companyVar } })
	export class Team {
		name = def.stringColumn()
		docs = def.oneHasMany(Doc, 'owner')
	}

	// Doc readable only when owner in scope AND visible=yes; `secret` is readable at the SAME (row) level,
	// so a visible=no Doc is a fully unreadable sibling whose `secret` must not act as a filter oracle.
	@acl.allow(reader, { read: ['id', 'title', 'secret', 'owner'], when: { owner: { id: companyVar }, visible: { eq: 'yes' } } })
	export class Doc {
		title = def.stringColumn()
		secret = def.stringColumn()
		visible = def.stringColumn()
		owner = def.manyHasOne(Team, 'docs').notNull()
	}
}

test('CLASS 5 — to-many back-reference oracle: unreadable sibling secret cannot leak via filter', async () => {
	const { restrictedA, teethA, teethB } = await assertLeakOracle({
		schema: createSchema(C5),
		role: 'reader',
		setupA: async t => {
			const team = await create(t, 'Team', { name: 'T' })
			await create(t, 'Doc', { title: 'visible-doc', secret: 'READABLE_VAL', visible: 'yes', owner: connect(team) })
			const hidden = await create(t, 'Doc', { title: 'hidden-doc', secret: 'none', visible: 'no', owner: connect(team) })
			return { variables: [{ name: 'company', values: [team] }], ctx: { hidden } }
		},
		// flip the UNREADABLE sibling's secret to the probe value
		mutateToB: async (t, ctx) => {
			await update(t, 'Doc', ctx.hidden, { secret: 'PROBE' })
		},
		restrictedQueries: [
			// oracle: the probe lives only on an unreadable sibling → must never match
			{ query: gql`query { listDoc(filter: { owner: { docs: { secret: { eq: "PROBE" } } } }, orderBy: [{ title: asc }]) { title } }` },
			// positive control: the same back-hop filter DOES match on a READABLE sibling's value
			{ query: gql`query { listDoc(filter: { owner: { docs: { secret: { eq: "READABLE_VAL" } } } }, orderBy: [{ title: asc }]) { title } }` },
		],
		teethQueries: [{
			query: gql`query { listDoc(filter: { owner: { docs: { secret: { eq: "PROBE" } } } }, orderBy: [{ title: asc }]) { title } }`,
		}],
	})
	// role: the probe lives only on an unreadable sibling → no match in either dataset (no value oracle)
	expect(restrictedA[0].listDoc).toStrictEqual([])
	// non-vacuous: the very same back-hop filter matches when the value is on a READABLE sibling
	expect(restrictedA[1].listDoc.map((d: any) => d.title)).toStrictEqual(['visible-doc'])
	// teeth: root sees the sibling → the filter starts matching once the sibling holds the probe
	expect(teethA[0].listDoc).toStrictEqual([])
	expect(teethB[0].listDoc.map((d: any) => d.title)).toStrictEqual(['hidden-doc', 'visible-doc'])
})

// =============================================================================================
// CLASS 5b: relation-local NOT — set-lowered relations use readable-view Boolean semantics
// =============================================================================================
namespace C5b {
	export const reader = acl.createRole('reader')
	export const companyVar = acl.createEntityVariable('company', 'Company', reader)

	@acl.allow(reader, { read: ['id', 'name', 'parents'], when: { id: companyVar } })
	export class Company {
		name = def.stringColumn()
		parents = def.oneHasMany(Parent, 'company')
	}

	@acl.allow(reader, {
		read: ['id', 'name', 'company', 'children', 'featuredChild', 'tags', 'middle', 'middles'],
		when: { company: { id: companyVar } },
	})
	export class Parent {
		name = def.stringColumn()
		company = def.manyHasOne(Company, 'parents').notNull()
		children = def.oneHasMany(Child, 'parent')
		featuredChild = def.manyHasOne(Child)
		tags = def.manyHasMany(Child)
		middle = def.manyHasOne(Middle)
		middles = def.oneHasMany(Middle, 'parent')
	}

	@acl.allow(reader, { read: true })
	export class Middle {
		featuredChild = def.manyHasOne(Child)
		children = def.oneHasMany(Child, 'middle')
		tags = def.manyHasMany(Child)
		parent = def.manyHasOne(Parent, 'middles')
	}

	@acl.allow(reader, { read: true, when: { visibility: { eq: 'yes' } } })
	export class Child {
		visibility = def.stringColumn()
		parent = def.manyHasOne(Parent, 'children')
		middle = def.manyHasOne(Middle, 'children')
	}
}

test('CLASS 5b — enclosing NOT complements readable 1:N targets', async () => {
	const { restrictedA, teethA, teethB } = await assertLeakOracle({
		schema: createSchema(C5b),
		role: 'reader',
		setupA: async t => {
			const company = await create(t, 'Company', { name: 'Acme' })
			const hiddenParent = await create(t, 'Parent', { name: 'hidden', company: connect(company) })
			await create(t, 'Parent', {
				name: 'readable',
				company: connect(company),
				children: { create: { visibility: 'yes' } },
			})
			return { variables: [{ name: 'company', values: [company] }], ctx: { hiddenParent } }
		},
		mutateToB: async (t, ctx) => {
			await update(t, 'Parent', ctx.hiddenParent, { children: { create: { visibility: 'no' } } })
		},
		restrictedQueries: [{
			query: gql`query { listParent(filter: { not: { children: { id: { isNull: false } } } }, orderBy: [{ name: asc }]) { name } }`,
		}, {
			query: gql`query { listParent(filter: { not: { children: { visibility: { eq: "blocked" } } } }, orderBy: [{ name: asc }]) { name } }`,
		}],
		teethQueries: [{
			query: gql`query { listParent(filter: { not: { children: { id: { isNull: false } } } }, orderBy: [{ name: asc }]) { name } }`,
		}],
	})
	expect(restrictedA[0].listParent).toStrictEqual([{ name: 'hidden' }])
	// A value predicate is also evaluated over the readable child set for a 1:N relation.
	expect(restrictedA[1].listParent).toStrictEqual([{ name: 'hidden' }, { name: 'readable' }])
	// Root sees absence turn into presence, proving the unreadable-row mutation has teeth.
	expect(teethA[0].listParent).toStrictEqual([{ name: 'hidden' }])
	expect(teethB[0].listParent).toStrictEqual([])
})

test('CLASS 5c — enclosing NOT gives absent and unreadable to-one targets the same result', async () => {
	const { restrictedA, teethA, teethB } = await assertLeakOracle({
		schema: createSchema(C5b),
		role: 'reader',
		setupA: async t => {
			const company = await create(t, 'Company', { name: 'Acme' })
			const absent = await create(t, 'Parent', { name: 'absent', company: connect(company) })
			await create(t, 'Parent', {
				name: 'visible',
				company: connect(company),
				featuredChild: { create: { visibility: 'yes' } },
			})
			return { variables: [{ name: 'company', values: [company] }], ctx: { absent } }
		},
		mutateToB: async (t, ctx) => {
			await update(t, 'Parent', ctx.absent, { featuredChild: { create: { visibility: 'no' } } })
		},
		restrictedQueries: [{
			query: gql`query { listParent(filter: { not: { featuredChild: { id: { isNull: false } } } }, orderBy: [{ name: asc }]) { name } }`,
		}, {
			query: gql`query { listParent(filter: { not: { featuredChild: { visibility: { eq: "blocked" } } } }, orderBy: [{ name: asc }]) { name } }`,
		}],
		teethQueries: [{
			query: gql`query { listParent(filter: { not: { featuredChild: { id: { isNull: false } } } }, orderBy: [{ name: asc }]) { name } }`,
		}],
	})
	expect(restrictedA[0].listParent).toStrictEqual([{ name: 'absent' }])
	expect(restrictedA[1].listParent).toStrictEqual([{ name: 'absent' }, { name: 'visible' }])
	expect(teethA[0].listParent).toStrictEqual([{ name: 'absent' }])
	expect(teethB[0].listParent).toStrictEqual([])
})

test('CLASS 5d — enclosing NOT complements readable M:N targets', async () => {
	const { restrictedA, teethA, teethB } = await assertLeakOracle({
		schema: createSchema(C5b),
		role: 'reader',
		setupA: async t => {
			const company = await create(t, 'Company', { name: 'Acme' })
			const absent = await create(t, 'Parent', { name: 'absent', company: connect(company) })
			await create(t, 'Parent', {
				name: 'visible',
				company: connect(company),
				tags: { create: { visibility: 'yes' } },
			})
			return { variables: [{ name: 'company', values: [company] }], ctx: { absent } }
		},
		mutateToB: async (t, ctx) => {
			await update(t, 'Parent', ctx.absent, { tags: { create: { visibility: 'no' } } })
		},
		restrictedQueries: [{
			query: gql`query { listParent(filter: { not: { tags: { id: { isNull: false } } } }, orderBy: [{ name: asc }]) { name } }`,
		}, {
			query: gql`query { listParent(filter: { not: { tags: { visibility: { eq: "blocked" } } } }, orderBy: [{ name: asc }]) { name } }`,
		}],
		teethQueries: [{
			query: gql`query { listParent(filter: { not: { tags: { id: { isNull: false } } } }, orderBy: [{ name: asc }]) { name } }`,
		}],
	})
	expect(restrictedA[0].listParent).toStrictEqual([{ name: 'absent' }])
	expect(restrictedA[1].listParent).toStrictEqual([{ name: 'absent' }, { name: 'visible' }])
	expect(teethA[0].listParent).toStrictEqual([{ name: 'absent' }])
	expect(teethB[0].listParent).toStrictEqual([])
})

test('CLASS 5e — enclosing NOT carries leaf guards through an unrestricted intermediate', async () => {
	const nestedRelations = ['featuredChild', 'children', 'tags']
	const { restrictedA, teethA, teethB } = await assertLeakOracle({
		schema: createSchema(C5b),
		role: 'reader',
		setupA: async t => {
			const company = await create(t, 'Company', { name: 'Acme' })
			const absentMiddle = await create(t, 'Middle', {})
			await create(t, 'Parent', { name: 'absent', company: connect(company), middle: connect(absentMiddle) })
			const visibleMiddle = await create(t, 'Middle', {
				featuredChild: { create: { visibility: 'yes' } },
				children: { create: { visibility: 'yes' } },
				tags: { create: { visibility: 'yes' } },
			})
			await create(t, 'Parent', { name: 'visible', company: connect(company), middle: connect(visibleMiddle) })
			return { variables: [{ name: 'company', values: [company] }], ctx: { absentMiddle } }
		},
		mutateToB: async (t, ctx) => {
			await update(t, 'Middle', ctx.absentMiddle, {
				featuredChild: { create: { visibility: 'no' } },
				children: { create: { visibility: 'no' } },
				tags: { create: { visibility: 'no' } },
			})
		},
		restrictedQueries: nestedRelations.flatMap(relation => [{
			query: `query { listParent(filter: { not: { middle: { ${relation}: { id: { isNull: false } } } } }, orderBy: [{ name: asc }]) { name } }`,
		}, {
			query: `query { listParent(filter: { not: { middle: { ${relation}: { visibility: { eq: "blocked" } } } } }, orderBy: [{ name: asc }]) { name } }`,
		}]),
		teethQueries: nestedRelations.map(relation => ({
			query: `query { listParent(filter: { not: { middle: { ${relation}: { id: { isNull: false } } } } }, orderBy: [{ name: asc }]) { name } }`,
		})),
	})
	for (let index = 0; index < nestedRelations.length; index++) {
		expect(restrictedA[index * 2].listParent).toStrictEqual([{ name: 'absent' }])
		expect(restrictedA[index * 2 + 1].listParent).toStrictEqual([{ name: 'absent' }, { name: 'visible' }])
		expect(teethA[index].listParent).toStrictEqual([{ name: 'absent' }])
		expect(teethB[index].listParent).toStrictEqual([])
	}
})

test('CLASS 5f — deep guard alternatives remain OR-local across intermediate rows', async () => {
	const { restrictedA, teethA, teethB } = await assertLeakOracle({
		schema: createSchema(C5b),
		role: 'reader',
		setupA: async t => {
			const company = await create(t, 'Company', { name: 'Acme' })
			const absent = await create(t, 'Parent', { name: 'absent', company: connect(company) })
			const absentMiddle = await create(t, 'Middle', { parent: connect(absent) })

			const childrenOnly = await create(t, 'Parent', { name: 'children-only', company: connect(company) })
			await create(t, 'Middle', { parent: connect(childrenOnly), children: { create: { visibility: 'yes' } } })

			const tagsOnly = await create(t, 'Parent', { name: 'tags-only', company: connect(company) })
			await create(t, 'Middle', { parent: connect(tagsOnly), tags: { create: { visibility: 'yes' } } })

			const bothSame = await create(t, 'Parent', { name: 'both-same', company: connect(company) })
			await create(t, 'Middle', {
				parent: connect(bothSame),
				children: { create: { visibility: 'yes' } },
				tags: { create: { visibility: 'yes' } },
			})

			const bothDifferent = await create(t, 'Parent', { name: 'both-different', company: connect(company) })
			await create(t, 'Middle', { parent: connect(bothDifferent), children: { create: { visibility: 'yes' } } })
			await create(t, 'Middle', { parent: connect(bothDifferent), tags: { create: { visibility: 'yes' } } })

			return { variables: [{ name: 'company', values: [company] }], ctx: { absentMiddle } }
		},
		mutateToB: async (t, ctx) => {
			await update(t, 'Middle', ctx.absentMiddle, {
				children: { create: { visibility: 'no' } },
				tags: { create: { visibility: 'no' } },
			})
		},
		restrictedQueries: [{
			query: gql`query { listParent(filter: { not: { middles: { or: [
				{ children: { id: { isNull: false } } },
				{ tags: { id: { isNull: false } } }
			] } } }, orderBy: [{ name: asc }]) { name } }`,
		}, {
			query: gql`query { listParent(filter: { not: { middles: { or: [
				{ children: { visibility: { eq: "blocked" } } },
				{ tags: { visibility: { eq: "blocked" } } }
			] } } }, orderBy: [{ name: asc }]) { name } }`,
		}],
		teethQueries: [{
			query: gql`query { listParent(filter: { not: { middles: { or: [
				{ children: { id: { isNull: false } } },
				{ tags: { id: { isNull: false } } }
			] } } }, orderBy: [{ name: asc }]) { name } }`,
		}],
	})
	expect(restrictedA[0].listParent).toStrictEqual([{ name: 'absent' }])
	expect(restrictedA[1].listParent).toStrictEqual([
		{ name: 'absent' },
		{ name: 'both-different' },
		{ name: 'both-same' },
		{ name: 'children-only' },
		{ name: 'tags-only' },
	])
	expect(teethA[0].listParent).toStrictEqual([{ name: 'absent' }])
	expect(teethB[0].listParent).toStrictEqual([])
})

// =============================================================================================
// CLASS 6: _meta.readable through a relation (through:true grant — root vs all divergence)
// =============================================================================================
namespace C6 {
	export const reader = acl.createRole('reader')
	export const companyVar = acl.createEntityVariable('company', 'Company', reader)

	@acl.allow(reader, { read: ['id', 'name'], when: { id: companyVar } })
	export class Company {
		name = def.stringColumn()
		posts = def.oneHasMany(Post, 'company')
	}

	@acl.allow(reader, { read: ['id', 'title', 'company', 'locales'], when: { company: { id: companyVar } } })
	export class Post {
		title = def.stringColumn()
		company = def.manyHasOne(Company, 'posts').notNull()
		locales = def.oneHasMany(PostLocale, 'post')
	}

	// PostLocale is readable ONLY through a relation (through:true → noRoot read): the root set denies it,
	// the `all` set grants it. Reached via Post.locales, its fields (incl. title) are readable. The fix makes
	// _meta.readable follow the SAME (through/all) context as the returned value. Row readable when visible=yes,
	// so a visible=no locale is an unreadable sibling row.
	@acl.allow(reader, { read: ['id', 'post', 'title'], through: true, when: { post: { company: { id: companyVar } }, visible: { eq: 'yes' } } })
	export class PostLocale {
		title = def.stringColumn()
		visible = def.stringColumn()
		post = def.manyHasOne(Post, 'locales').notNull()
	}
}

test('CLASS 6 — _meta.readable through a relation: consistent with the returned value, no sibling leak', async () => {
	const throughQuery = gql`query { listPost { title locales { title _meta { title { readable } } } } }`

	const { restrictedA } = await assertLeakOracle({
		schema: createSchema(C6),
		role: 'reader',
		setupA: async t => {
			const company = await create(t, 'Company', { name: 'Acme' })
			const post = await create(t, 'Post', { title: 'p', company: connect(company) })
			await create(t, 'PostLocale', { title: 'hello', visible: 'yes', post: connect(post) }) // readable locale
			const hidden = await create(t, 'PostLocale', { title: 'secretA', visible: 'no', post: connect(post) }) // unreadable sibling
			return { variables: [{ name: 'company', values: [company] }], ctx: { hidden } }
		},
		// change the UNREADABLE sibling locale's title
		mutateToB: async (t, ctx) => {
			await update(t, 'PostLocale', ctx.hidden, { title: 'secretB' })
		},
		restrictedQueries: [{ query: throughQuery }],
		// teeth: root sees the hidden sibling's title change
		teethQueries: [{ query: gql`query { listPostLocale(orderBy: [{ visible: asc }]) { title } }` }],
	})

	// Through the relation the value IS returned, and _meta.readable=true agrees with it (fix evaluates
	// _meta against the through/all set). A regression that read _meta from the root set would report
	// readable:false while still returning "hello" — caught here. Only the readable locale shows.
	expect(restrictedA[0].listPost).toStrictEqual([{
		title: 'p',
		locales: [{ title: 'hello', _meta: { title: { readable: true } } }],
	}])
})
