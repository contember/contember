import { expect, test } from 'bun:test'
import { createTester, gql, rootToken } from '../../src/tester.js'
import { AclDefinition as acl, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import type { Schema } from '@contember/schema'

// ACL read-path GAP audit. Metamorphic oracle: "changing a value a restricted role cannot read must never
// change what that role's query returns." For each shape we build two dataset states differing ONLY in
// unreadable data and assert byte-identical restricted output; teeth (root) MUST differ. Shapes here target
// gaps NOT covered by acl-leak-oracle / acl-isnull-relation-readable-view / acl-nested-predicate-closure.

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
	setupA: (tester: any) => Promise<{ variables: MembershipVar[]; ctx: any }>
	mutateToB: (tester: any, ctx: any) => Promise<void>
	restrictedQueries: Query[]
	teethQueries: Query[]
}

const assertLeakOracle = async (cfg: OracleConfig) => {
	const tester = await createTester(cfg.schema)
	const { variables, ctx } = await cfg.setupA(tester)

	const email = `audit_${cfg.role}_${Date.now()}_${Math.random().toString(36).slice(2)}@doe.com`
	const identityId = await tester.tenant.signUp(email)
	const authKey = await tester.tenant.signIn(email)
	await tester.tenant.addProjectMember(identityId, tester.projectSlug, { role: cfg.role, variables })

	const restrictedA = await run(tester, authKey, cfg.restrictedQueries)
	const teethA = await run(tester, rootToken, cfg.teethQueries)

	await cfg.mutateToB(tester, ctx)

	const restrictedB = await run(tester, authKey, cfg.restrictedQueries)
	const teethB = await run(tester, rootToken, cfg.teethQueries)

	return { tester, authKey, restrictedA, restrictedB, teethA, teethB }
}

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
// SHAPE 1: to-many `some` FILTER on an unreadable CELL of a readable target row.
// Post.comments is oneHasMany; Comment ROW is readable (in company) but `secret` is cell-guarded
// (readable only when visible=yes). Filter `{ comments: { secret: { eq: PROBE } } }` must operate on
// the role's MASKED view of `secret` — a masked (visible=no) comment must never match the probe.
// =============================================================================================
namespace S1 {
	export const reader = acl.createRole('reader')
	export const companyVar = acl.createEntityVariable('company', 'Company', reader)

	@acl.allow(reader, { read: ['id', 'name'], when: { id: companyVar } })
	export class Company {
		name = def.stringColumn()
		posts = def.oneHasMany(Post, 'company')
		comments = def.oneHasMany(Comment, 'company')
	}

	@acl.allow(reader, { read: ['id', 'title', 'company', 'comments'], when: { company: { id: companyVar } } })
	export class Post {
		title = def.stringColumn()
		company = def.manyHasOne(Company, 'posts').notNull()
		comments = def.oneHasMany(Comment, 'post')
	}

	// Comment row readable in company; `secret` masked unless visible=yes → cell-level guard.
	@acl.allow(reader, { read: ['id', 'label', 'company', 'post'], when: { company: { id: companyVar } } })
	@acl.allow(reader, { read: ['secret'], when: { company: { id: companyVar }, visible: { eq: 'yes' } } })
	export class Comment {
		label = def.stringColumn()
		secret = def.stringColumn()
		visible = def.stringColumn()
		company = def.manyHasOne(Company, 'comments').notNull()
		post = def.manyHasOne(Post, 'comments').notNull()
	}
}

test('SHAPE 1 — to-many some-filter on a masked cell of a readable row cannot leak', async () => {
	const { restrictedA, restrictedB, teethA, teethB } = await assertLeakOracle({
		schema: createSchema(S1),
		role: 'reader',
		setupA: async t => {
			const company = await create(t, 'Company', { name: 'Acme' })
			const post = await create(t, 'Post', { title: 'p', company: connect(company) })
			// readable-row comment whose `secret` cell is masked (visible=no)
			const c = await create(t, 'Comment', { label: 'c', secret: 'none', visible: 'no', company: connect(company), post: connect(post) })
			return { variables: [{ name: 'company', values: [company] }], ctx: { c } }
		},
		// flip the masked cell to the probe value (row stays readable, cell stays masked)
		mutateToB: async (t, ctx) => {
			await update(t, 'Comment', ctx.c, { secret: 'PROBE' })
		},
		restrictedQueries: [
			{ query: gql`query { listPost(filter: { comments: { secret: { eq: "PROBE" } } }, orderBy: [{ title: asc }]) { title } }` },
			{ query: gql`query { listPost(filter: { not: { comments: { secret: { eq: "PROBE" } } } }, orderBy: [{ title: asc }]) { title } }` },
		],
		teethQueries: [{ query: gql`query { listPost(filter: { comments: { secret: { eq: "PROBE" } } }) { title } }` }],
	})
	expect(restrictedB, 'LEAK S1: masked-cell to-many filter changed with only-unreadable data').toStrictEqual(restrictedA)
	expect(teethB, 'VACUOUS S1').not.toStrictEqual(teethA)
	console.log('SHAPE1 restrictedA some=', JSON.stringify(restrictedA[0]), ' none=', JSON.stringify(restrictedA[1]))
	console.log('SHAPE1 restrictedB some=', JSON.stringify(restrictedB[0]), ' none=', JSON.stringify(restrictedB[1]))
	console.log('SHAPE1 teethA=', JSON.stringify(teethA[0]), ' teethB=', JSON.stringify(teethB[0]))
})

// =============================================================================================
// SHAPE 2: M:N `some` FILTER on an unreadable CELL of a readable target row (junction lowering).
// Post.tags is manyHasMany; Tag ROW readable, `secret` cell-guarded. Same oracle as S1 but through the
// junction path.
// =============================================================================================
namespace S2 {
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

	@acl.allow(reader, { read: ['id', 'label', 'company'], when: { company: { id: companyVar } } })
	@acl.allow(reader, { read: ['secret'], when: { company: { id: companyVar }, visible: { eq: 'yes' } } })
	export class Tag {
		label = def.stringColumn()
		secret = def.stringColumn()
		visible = def.stringColumn()
		company = def.manyHasOne(Company, 'tags').notNull()
	}
}

test('SHAPE 2 — M:N some-filter on a masked cell of a readable row cannot leak', async () => {
	const { restrictedA, restrictedB, teethA, teethB } = await assertLeakOracle({
		schema: createSchema(S2),
		role: 'reader',
		setupA: async t => {
			const company = await create(t, 'Company', { name: 'Acme' })
			const tag = await create(t, 'Tag', { label: 't', secret: 'none', visible: 'no', company: connect(company) })
			await create(t, 'Post', { title: 'p', company: connect(company), tags: [connect(tag)] })
			return { variables: [{ name: 'company', values: [company] }], ctx: { tag } }
		},
		mutateToB: async (t, ctx) => {
			await update(t, 'Tag', ctx.tag, { secret: 'PROBE' })
		},
		restrictedQueries: [
			{ query: gql`query { listPost(filter: { tags: { secret: { eq: "PROBE" } } }, orderBy: [{ title: asc }]) { title } }` },
			{ query: gql`query { listPost(filter: { not: { tags: { secret: { eq: "PROBE" } } } }, orderBy: [{ title: asc }]) { title } }` },
		],
		teethQueries: [{ query: gql`query { listPost(filter: { tags: { secret: { eq: "PROBE" } } }) { title } }` }],
	})
	expect(restrictedB, 'LEAK S2: masked-cell M:N filter changed with only-unreadable data').toStrictEqual(restrictedA)
	expect(teethB, 'VACUOUS S2').not.toStrictEqual(teethA)
	console.log('SHAPE2 restrictedA some=', JSON.stringify(restrictedA[0]), ' none=', JSON.stringify(restrictedA[1]))
	console.log('SHAPE2 restrictedB some=', JSON.stringify(restrictedB[0]), ' none=', JSON.stringify(restrictedB[1]))
})

// =============================================================================================
// SHAPE 3: nested paginate totalCount + edges must count ONLY readable rows within a relation, and be
// invariant to unreadable-sibling changes. Post.locales: some readable (visible=yes), some unreadable
// rows (visible=no). paginateLocales.totalCount / edges must not see the unreadable sibling.
// =============================================================================================
namespace S3 {
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

	// Row readable only when visible=yes → a visible=no locale is an unreadable sibling row.
	@acl.allow(reader, { read: ['id', 'value', 'post'], when: { post: { company: { id: companyVar } }, visible: { eq: 'yes' } } })
	export class PostLocale {
		value = def.stringColumn()
		visible = def.stringColumn()
		post = def.manyHasOne(Post, 'locales').notNull()
	}
}

test('SHAPE 3 — nested paginate totalCount/edges count only readable rows, invariant to unreadable siblings', async () => {
	const { restrictedA, restrictedB, teethA, teethB } = await assertLeakOracle({
		schema: createSchema(S3),
		role: 'reader',
		setupA: async t => {
			const company = await create(t, 'Company', { name: 'Acme' })
			const post = await create(t, 'Post', { title: 'p', company: connect(company) })
			await create(t, 'PostLocale', { value: 'r1', visible: 'yes', post: connect(post) })
			const hidden = await create(t, 'PostLocale', { value: 'h1', visible: 'no', post: connect(post) })
			return { variables: [{ name: 'company', values: [company] }], ctx: { post, hidden } }
		},
		// add ANOTHER unreadable sibling + mutate the existing one — role must not observe any of it
		mutateToB: async (t, ctx) => {
			await update(t, 'PostLocale', ctx.hidden, { value: 'h1-mut' })
			await create(t, 'PostLocale', { value: 'h2', visible: 'no', post: connect(ctx.post) })
		},
		restrictedQueries: [
			{ query: gql`query { listPost { title paginateLocales { pageInfo { totalCount } edges { node { value } } } } }` },
			{ query: gql`query { listPost { title localesMeta: paginateLocales(filter: { value: { isNull: false } }) { pageInfo { totalCount } } } }` },
		],
		teethQueries: [{ query: gql`query { listPost { title paginateLocales { pageInfo { totalCount } } } }` }],
	})
	expect(restrictedB, 'LEAK S3: nested totalCount/edges changed with only-unreadable data').toStrictEqual(restrictedA)
	expect(teethB, 'VACUOUS S3').not.toStrictEqual(teethA)
	console.log('SHAPE3 restrictedA=', JSON.stringify(restrictedA[0]))
	console.log('SHAPE3 teethA=', JSON.stringify(teethA[0]), ' teethB=', JSON.stringify(teethB[0]))
	expect(restrictedA[0].listPost[0].paginateLocales.pageInfo.totalCount, 'nested totalCount = readable only').toBe(1)
})

// =============================================================================================
// SHAPE 4: order-by on a MASKED cell with pagination (limit/offset) as the ONLY sort key — page
// boundaries must not leak the unreadable order (bisection oracle). Masked sortKey is NULL for the role,
// so order falls to a stable tie-break; permuting the real (unreadable) sortKey must not move rows across
// page boundaries.
// =============================================================================================
namespace S4 {
	export const reader = acl.createRole('reader')
	export const companyVar = acl.createEntityVariable('company', 'Company', reader)

	@acl.allow(reader, { read: ['id', 'name'], when: { id: companyVar } })
	export class Company {
		name = def.stringColumn()
		items = def.oneHasMany(Item, 'company')
	}

	@acl.allow(reader, { read: ['id', 'name', 'company'], when: { company: { id: companyVar } } })
	@acl.allow(reader, { read: ['sortKey'], when: { company: { id: companyVar }, elevated: { eq: 'yes' } } })
	export class Item {
		name = def.stringColumn()
		sortKey = def.intColumn()
		elevated = def.stringColumn()
		company = def.manyHasOne(Company, 'items').notNull()
	}
}

test('SHAPE 4 — order-by on masked cell as sole sort key with pagination cannot leak via page boundaries', async () => {
	const { restrictedA, restrictedB, teethA, teethB } = await assertLeakOracle({
		schema: createSchema(S4),
		role: 'reader',
		setupA: async t => {
			const company = await create(t, 'Company', { name: 'Acme' })
			const a = await create(t, 'Item', { name: 'a', elevated: 'no', sortKey: 1, company: connect(company) })
			const b = await create(t, 'Item', { name: 'b', elevated: 'no', sortKey: 2, company: connect(company) })
			const c = await create(t, 'Item', { name: 'c', elevated: 'no', sortKey: 3, company: connect(company) })
			const d = await create(t, 'Item', { name: 'd', elevated: 'no', sortKey: 4, company: connect(company) })
			return { variables: [{ name: 'company', values: [company] }], ctx: { a, b, c, d } }
		},
		// reverse the masked sortKeys
		mutateToB: async (t, ctx) => {
			await update(t, 'Item', ctx.a, { sortKey: 4 })
			await update(t, 'Item', ctx.b, { sortKey: 3 })
			await update(t, 'Item', ctx.c, { sortKey: 2 })
			await update(t, 'Item', ctx.d, { sortKey: 1 })
		},
		restrictedQueries: [
			// order ONLY by the masked cell, paginate page-by-page
			{ query: gql`query { listItem(orderBy: [{ sortKey: asc }], limit: 2, offset: 0) { name } }` },
			{ query: gql`query { listItem(orderBy: [{ sortKey: asc }], limit: 2, offset: 2) { name } }` },
			{ query: gql`query { listItem(orderBy: [{ sortKey: desc }], limit: 1, offset: 0) { name } }` },
		],
		teethQueries: [{ query: gql`query { listItem(orderBy: [{ sortKey: asc }]) { name } }` }],
	})
	expect(restrictedB, 'LEAK S4: masked sort-key page boundaries changed with only-unreadable data').toStrictEqual(restrictedA)
	expect(teethB, 'VACUOUS S4').not.toStrictEqual(teethA)
	console.log(
		'SHAPE4 restrictedA page0=',
		JSON.stringify(restrictedA[0]),
		' page1=',
		JSON.stringify(restrictedA[1]),
		' desc1=',
		JSON.stringify(restrictedA[2]),
	)
	console.log(
		'SHAPE4 restrictedB page0=',
		JSON.stringify(restrictedB[0]),
		' page1=',
		JSON.stringify(restrictedB[1]),
		' desc1=',
		JSON.stringify(restrictedB[2]),
	)
})

// =============================================================================================
// SHAPE 5: order-by THROUGH a to-many/M:N relation on a masked target cell combined with limit — the
// nested relation page order must not leak the unreadable ordering of siblings. (CLASS 3 covered m2m
// order-by top-2; here we add offset paging + a to-many oneHasMany variant.)
// =============================================================================================
namespace S5 {
	export const reader = acl.createRole('reader')
	export const companyVar = acl.createEntityVariable('company', 'Company', reader)

	@acl.allow(reader, { read: ['id', 'name'], when: { id: companyVar } })
	export class Company {
		name = def.stringColumn()
		posts = def.oneHasMany(Post, 'company')
		comments = def.oneHasMany(Comment, 'company')
	}

	@acl.allow(reader, { read: ['id', 'title', 'company', 'comments'], when: { company: { id: companyVar } } })
	export class Post {
		title = def.stringColumn()
		company = def.manyHasOne(Company, 'posts').notNull()
		comments = def.oneHasMany(Comment, 'post')
	}

	@acl.allow(reader, { read: ['id', 'label', 'company', 'post'], when: { company: { id: companyVar } } })
	@acl.allow(reader, { read: ['rank'], when: { company: { id: companyVar }, visible: { eq: 'yes' } } })
	export class Comment {
		label = def.stringColumn()
		rank = def.intColumn()
		visible = def.stringColumn()
		company = def.manyHasOne(Company, 'comments').notNull()
		post = def.manyHasOne(Post, 'comments').notNull()
	}
}

test('SHAPE 5 — order-by through to-many on masked cell + paging cannot leak sibling order', async () => {
	const { restrictedA, restrictedB, teethA, teethB } = await assertLeakOracle({
		schema: createSchema(S5),
		role: 'reader',
		setupA: async t => {
			const company = await create(t, 'Company', { name: 'Acme' })
			const post = await create(t, 'Post', { title: 'p', company: connect(company) })
			const c1 = await create(t, 'Comment', { label: 'l1', rank: 1, visible: 'no', company: connect(company), post: connect(post) })
			await create(t, 'Comment', { label: 'l2', rank: 2, visible: 'no', company: connect(company), post: connect(post) })
			const c3 = await create(t, 'Comment', { label: 'l3', rank: 3, visible: 'no', company: connect(company), post: connect(post) })
			return { variables: [{ name: 'company', values: [company] }], ctx: { c1, c3 } }
		},
		mutateToB: async (t, ctx) => {
			await update(t, 'Comment', ctx.c1, { rank: 3 })
			await update(t, 'Comment', ctx.c3, { rank: 1 })
		},
		restrictedQueries: [
			{ query: gql`query { listPost { title comments(orderBy: [{ rank: asc }], limit: 2, offset: 0) { label } } }` },
			{ query: gql`query { listPost { title comments(orderBy: [{ rank: asc }], limit: 2, offset: 1) { label } } }` },
			{ query: gql`query { listPost { title paginateComments(orderBy: [{ rank: asc }], first: 2) { edges { node { label } } } } }` },
		],
		teethQueries: [{ query: gql`query { listPost { title comments(orderBy: [{ rank: asc }]) { label } } }` }],
	})
	expect(restrictedB, 'LEAK S5: to-many masked order-by paging changed with only-unreadable data').toStrictEqual(restrictedA)
	expect(teethB, 'VACUOUS S5').not.toStrictEqual(teethA)
	console.log('SHAPE5 restrictedA=', JSON.stringify(restrictedA))
	console.log('SHAPE5 restrictedB=', JSON.stringify(restrictedB))
})

// =============================================================================================
// SHAPE 6: relation-traversing CELL guard — a field whose read guard traverses a relation
// (Employee.salary readable when { dept: { open: eq true } }). The traversed Dept has its OWN read
// predicate (company scope). If salary's guard does not enforce Dept readability, an unreadable Dept
// (other company) with open=true leaks salary; and mutating that unreadable dept's `open` would move
// salary in/out → leak.
// =============================================================================================
namespace S6 {
	export const reader = acl.createRole('reader')
	export const companyVar = acl.createEntityVariable('company', 'Company', reader)

	@acl.allow(reader, { read: ['id', 'name'], when: { id: companyVar } })
	export class Company {
		name = def.stringColumn()
		employees = def.oneHasMany(Employee, 'company')
		depts = def.oneHasMany(Dept, 'company')
	}

	// Employee row readable in company; `salary` readable only when its dept is open — guard TRAVERSES dept.
	@acl.allow(reader, { read: ['id', 'name', 'company', 'dept'], when: { company: { id: companyVar } } })
	@acl.allow(reader, { read: ['salary'], when: { company: { id: companyVar }, dept: { open: { eq: true } } } })
	export class Employee {
		name = def.stringColumn()
		salary = def.intColumn()
		company = def.manyHasOne(Company, 'employees').notNull()
		dept = def.manyHasOne(Dept).notNull()
	}

	// Dept readable only within company scope (a dept in another company is unreadable to the role).
	@acl.allow(reader, { read: ['id', 'title', 'open', 'company'], when: { company: { id: companyVar } } })
	export class Dept {
		title = def.stringColumn()
		open = def.boolColumn()
		company = def.manyHasOne(Company, 'depts').notNull()
	}
}

test('SHAPE 6 — relation-traversing cell guard: unreadable traversed relation must not leak the cell', async () => {
	const { restrictedA, restrictedB, teethA, teethB } = await assertLeakOracle({
		schema: createSchema(S6),
		role: 'reader',
		setupA: async t => {
			const mine = await create(t, 'Company', { name: 'Mine' })
			const other = await create(t, 'Company', { name: 'Other' }) // NOT in role scope
			// dept in the OTHER (unreadable) company, open=true
			const otherDept = await create(t, 'Dept', { title: 'od', open: true, company: connect(other) })
			// employee is in MY company (row readable) but its dept is the unreadable other-company dept
			await create(t, 'Employee', { name: 'e', salary: 100, company: connect(mine), dept: connect(otherDept) })
			return { variables: [{ name: 'company', values: [mine] }], ctx: { otherDept } }
		},
		// mutate the UNREADABLE dept's `open` true->false. If salary readability tracks it, the guard leaked
		// dept.open (unreadable data).
		mutateToB: async (t, ctx) => {
			await update(t, 'Dept', ctx.otherDept, { open: false })
		},
		restrictedQueries: [
			{ query: gql`query { listEmployee(orderBy: [{ name: asc }]) { name salary dept { title } } }` },
			// filter by salary (masked): does the guard leak via filter?
			{ query: gql`query { listEmployee(filter: { salary: { eq: 100 } }, orderBy: [{ name: asc }]) { name } }` },
		],
		teethQueries: [{ query: gql`query { listEmployee { name salary dept { title open } } }` }],
	})
	console.log('SHAPE6 restrictedA=', JSON.stringify(restrictedA))
	console.log('SHAPE6 restrictedB=', JSON.stringify(restrictedB))
	console.log('SHAPE6 teethA=', JSON.stringify(teethA), ' teethB=', JSON.stringify(teethB))
	// LEAK (RED): the salary cell-read guard `{ dept: { open: eq true } }` is evaluated against the RAW
	// dept row, NOT the role's readable view of Dept. The employee's dept is in another company (unreadable:
	// note dept projection is null), yet:
	//   • state A (unreadable dept.open=true)  → salary = 100 is revealed
	//   • state B (unreadable dept.open=false) → salary = null
	// so flipping an UNREADABLE dept's `open` moves an otherwise-masked cell in/out of the response — the role
	// can read the unreadable dept.open through the salary mask. Same class as acl-nested-predicate-closure
	// (recursive-ACL-closure), but for a FIELD (cell) read guard rather than a ROW read predicate.
	expect(restrictedB, 'LEAK S6: cell guard traversing an unreadable relation changed with only-unreadable data').toStrictEqual(restrictedA)
	expect(teethB, 'VACUOUS S6').not.toStrictEqual(teethA)
})

// =============================================================================================
// SHAPE 7: deep mixed composition — nested NOT/AND/OR mixing a scalar cell guard + relation presence +
// to-many across 2 levels, over only-unreadable data.
// =============================================================================================
namespace S7 {
	export const reader = acl.createRole('reader')
	export const companyVar = acl.createEntityVariable('company', 'Company', reader)

	@acl.allow(reader, { read: ['id', 'name'], when: { id: companyVar } })
	export class Company {
		name = def.stringColumn()
		posts = def.oneHasMany(Post, 'company')
		comments = def.oneHasMany(Comment, 'company')
	}

	@acl.allow(reader, { read: ['id', 'title', 'company', 'comments'], when: { company: { id: companyVar } } })
	@acl.allow(reader, { read: ['secret'], when: { company: { id: companyVar }, flag: { eq: 'yes' } } })
	export class Post {
		title = def.stringColumn()
		secret = def.stringColumn()
		flag = def.stringColumn()
		company = def.manyHasOne(Company, 'posts').notNull()
		comments = def.oneHasMany(Comment, 'post')
	}

	// Comment row readable only when visible=yes → unreadable rows; `note` cell readable at row level.
	@acl.allow(reader, { read: ['id', 'note', 'company', 'post'], when: { company: { id: companyVar }, visible: { eq: 'yes' } } })
	export class Comment {
		note = def.stringColumn()
		visible = def.stringColumn()
		company = def.manyHasOne(Company, 'comments').notNull()
		post = def.manyHasOne(Post, 'comments').notNull()
	}
}

test('SHAPE 7 — deep mixed NOT/AND/OR (scalar cell guard + to-many presence) cannot leak', async () => {
	const { restrictedA, restrictedB, teethA, teethB } = await assertLeakOracle({
		schema: createSchema(S7),
		role: 'reader',
		setupA: async t => {
			const company = await create(t, 'Company', { name: 'Acme' })
			// p1: masked secret (flag=no), one unreadable comment (visible=no)
			const p1 = await create(t, 'Post', { title: 'p1', secret: 'none', flag: 'no', company: connect(company) })
			const hc = await create(t, 'Comment', { note: 'n', visible: 'no', company: connect(company), post: connect(p1) })
			// p2: masked secret, one readable comment (visible=yes)
			const p2 = await create(t, 'Post', { title: 'p2', secret: 'none', flag: 'no', company: connect(company) })
			await create(t, 'Comment', { note: 'n', visible: 'yes', company: connect(company), post: connect(p2) })
			return { variables: [{ name: 'company', values: [company] }], ctx: { hc } }
		},
		// mutate only unreadable data: masked secret + the unreadable comment's note
		mutateToB: async (t, ctx) => {
			await update(t, 'Comment', ctx.hc, { note: 'PROBE' })
		},
		restrictedQueries: [
			{
				query:
					gql`query { listPost(filter: { not: { or: [ { secret: { eq: "PROBE" } }, { comments: { note: { eq: "PROBE" } } } ] } }, orderBy: [{ title: asc }]) { title } }`,
			},
			{
				query:
					gql`query { listPost(filter: { and: [ { not: { secret: { eq: "PROBE" } } }, { comments: { id: { isNull: false } } } ] }, orderBy: [{ title: asc }]) { title } }`,
			},
			{ query: gql`query { listPost(filter: { comments: { note: { eq: "PROBE" } } }, orderBy: [{ title: asc }]) { title } }` },
		],
		teethQueries: [{ query: gql`query { listPost(filter: { comments: { note: { eq: "PROBE" } } }) { title } }` }],
	})
	expect(restrictedB, 'LEAK S7: deep mixed composition changed with only-unreadable data').toStrictEqual(restrictedA)
	expect(teethB, 'VACUOUS S7').not.toStrictEqual(teethA)
	console.log('SHAPE7 restrictedA=', JSON.stringify(restrictedA))
	console.log('SHAPE7 restrictedB=', JSON.stringify(restrictedB))
})

// =============================================================================================
// SHAPE 8: _meta.updatable / _meta.readable reachable via read — must reflect the role's masked view and
// be invariant to unreadable data. secretA cell-guarded; _meta.secretA.{readable,updatable}.
// =============================================================================================
namespace S8 {
	export const reader = acl.createRole('reader')

	@acl.allow(reader, { read: ['id', 'name', 'visibleA'] })
	@acl.allow(reader, { read: ['secretA'], update: ['secretA'], when: { visibleA: { eq: 'yes' } } })
	export class Doc {
		name = def.stringColumn()
		visibleA = def.stringColumn()
		secretA = def.stringColumn()
	}
}

test('SHAPE 8 — _meta.readable/_meta.updatable reflect masked view, invariant to unreadable data', async () => {
	const { restrictedA, restrictedB, teethA, teethB } = await assertLeakOracle({
		schema: createSchema(S8),
		role: 'reader',
		setupA: async t => {
			const pub = await create(t, 'Doc', { name: 'pub', visibleA: 'yes', secretA: 'pubA' })
			const hid = await create(t, 'Doc', { name: 'hid', visibleA: 'no', secretA: 'hidA' })
			return { variables: [], ctx: { hid, pub } }
		},
		mutateToB: async (t, ctx) => {
			await update(t, 'Doc', ctx.hid, { secretA: 'PROBE' })
		},
		restrictedQueries: [
			{ query: gql`query { listDoc(orderBy: [{ name: asc }]) { name secretA _meta { secretA { readable updatable } } } }` },
		],
		teethQueries: [{ query: gql`query { listDoc(filter: { name: { eq: "hid" } }) { secretA } }` }],
	})
	expect(restrictedB, 'LEAK S8: _meta changed with only-unreadable data').toStrictEqual(restrictedA)
	expect(teethB, 'VACUOUS S8').not.toStrictEqual(teethA)
	console.log('SHAPE8 restrictedA=', JSON.stringify(restrictedA[0]))
})
