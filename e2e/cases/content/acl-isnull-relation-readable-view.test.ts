import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester.js'
import { AclDefinition as acl, createSchema, SchemaDefinition as def } from '@contember/schema-definition'

// Relation filters must operate on the role's READABLE view of the relation (rows it cannot read are
// invisible, so they look absent). For each relation kind × predicate depth we create three parents whose
// child is {absent, present-readable, present-unreadable} and assert that, for the role:
//   • { rel: { id: { isNull: true } } }  matches exactly the parents whose relation reads empty,
//   • { rel: { id: { isNull: false } } } and a positive filter match exactly the parents with a readable row,
//   • not(isNull) == isNull:false (excluded middle holds — no row falls through both),
// so a present-but-unreadable row never leaks its existence. Regression for the isNull-relation ACL fix.

const names = (rows: any[]) => rows.map(r => r.name).sort()

type RunArgs = { label: string; relField: string; schema: any; setup: (t: any) => Promise<{ company: string }> }

async function runMatrix({ label, relField, schema, setup }: RunArgs) {
	const tester = await createTester(schema)
	const { company } = await setup(tester)
	const email = `reader${label.replace(/[^a-z0-9]/gi, '')}${Date.now()}@doe.com`
	const identityId = await tester.tenant.signUp(email)
	const authKey = await tester.tenant.signIn(email)
	await tester.tenant.addProjectMember(identityId, tester.projectSlug, { role: 'reader', variables: [{ name: 'company', values: [company] }] })

	const readRes =
		(await tester(gql`query { listParent(orderBy: [{ name: asc }]) { name child { id } } }`, { authorizationToken: authKey }).expect(200)).body.data
			.listParent
	const readsEmpty = readRes.filter((p: any) => {
		const v = p[relField]
		return v == null || (Array.isArray(v) && v.length === 0)
	}).map((p: any) => p.name).sort()
	const hasReadable = readRes.filter((p: any) => {
		const v = p[relField]
		return v != null && !(Array.isArray(v) && v.length === 0)
	}).map((p: any) => p.name).sort()

	const q = gql`query ($filter: ParentWhere) { listParent(filter: $filter, orderBy: [{ name: asc }]) { name } }`
	const match = async (filter: any) =>
		names((await tester(q, { variables: { filter }, authorizationToken: authKey }).expect(200)).body.data.listParent)

	const isNullTrue = await match({ [relField]: { id: { isNull: true } } })
	const isNullFalse = await match({ [relField]: { id: { isNull: false } } })
	const notIsNull = await match({ not: { [relField]: { id: { isNull: true } } } })
	const positive = await match({ [relField]: { label: { eq: 'x' } } })

	console.log(`\n${label}: readsEmpty=[${readsEmpty}] hasReadable=[${hasReadable}]`)
	console.log(`  isNull:true=[${isNullTrue}]  isNull:false=[${isNullFalse}]  not(isNull)=[${notIsNull}]  label=x=[${positive}]`)

	// Semantic 2: relation filters operate on the readable view of the relation.
	expect(isNullTrue, `${label} isNull:true must equal readsEmpty`).toEqual(readsEmpty)
	expect(isNullFalse, `${label} isNull:false must equal hasReadable`).toEqual(hasReadable)
	expect(notIsNull, `${label} not(isNull) must equal hasReadable`).toEqual(hasReadable)
	expect(positive, `${label} label=x must equal hasReadable`).toEqual(hasReadable)
	// excluded middle: isNull:true and isNull:false partition all parents
	expect([...isNullTrue, ...isNullFalse].sort(), `${label} isNull true/false must partition`).toEqual(readRes.map((p: any) => p.name).sort())
}

const mkCompany = async (t: any, name: string) =>
	(await t(gql`mutation ($n: String!) { createCompany(data: { name: $n }) { node { id } } }`, { variables: { n: name } }).expect(200)).body.data
		.createCompany.node.id

// to-one self-contained
namespace ToOneSelf {
	export const reader = acl.createRole('reader')
	export const v = acl.createEntityVariable('company', 'Company', reader)

	@acl.allow(reader, { read: true, when: { id: v } })
	export class Company {
		name = def.stringColumn()
		parents = def.oneHasMany(Parent, 'company')
	}

	@acl.allow(reader, { read: true, when: { company: { id: v } } })
	export class Parent {
		name = def.stringColumn()
		company = def.manyHasOne(Company, 'parents').notNull()
		child = def.manyHasOne(Child)
	}

	@acl.allow(reader, { read: true, when: { visibility: { eq: 'public' } } })
	export class Child {
		label = def.stringColumn()
		visibility = def.stringColumn()
	}
}
namespace ToOneDeep {
	export const reader = acl.createRole('reader')
	export const v = acl.createEntityVariable('company', 'Company', reader)

	@acl.allow(reader, { read: true, when: { id: v } })
	export class Company {
		name = def.stringColumn()
		parents = def.oneHasMany(Parent, 'company')
	}

	@acl.allow(reader, { read: true, when: { company: { id: v } } })
	export class Parent {
		name = def.stringColumn()
		company = def.manyHasOne(Company, 'parents').notNull()
		child = def.manyHasOne(Child)
	}

	@acl.allow(reader, { read: true, when: { owner: { id: v } } })
	export class Child {
		label = def.stringColumn()
		owner = def.manyHasOne(Company).notNull()
	}
}
namespace ManySelf {
	export const reader = acl.createRole('reader')
	export const v = acl.createEntityVariable('company', 'Company', reader)

	@acl.allow(reader, { read: true, when: { id: v } })
	export class Company {
		name = def.stringColumn()
		parents = def.oneHasMany(Parent, 'company')
	}

	@acl.allow(reader, { read: true, when: { company: { id: v } } })
	export class Parent {
		name = def.stringColumn()
		company = def.manyHasOne(Company, 'parents').notNull()
		child = def.oneHasMany(Child, 'parent')
	}

	@acl.allow(reader, { read: true, when: { visibility: { eq: 'public' } } })
	export class Child {
		label = def.stringColumn()
		visibility = def.stringColumn()
		parent = def.manyHasOne(Parent, 'child').notNull()
	}
}
namespace ManyDeep {
	export const reader = acl.createRole('reader')
	export const v = acl.createEntityVariable('company', 'Company', reader)

	@acl.allow(reader, { read: true, when: { id: v } })
	export class Company {
		name = def.stringColumn()
		parents = def.oneHasMany(Parent, 'company')
	}

	@acl.allow(reader, { read: true, when: { company: { id: v } } })
	export class Parent {
		name = def.stringColumn()
		company = def.manyHasOne(Company, 'parents').notNull()
		child = def.oneHasMany(Child, 'parent')
	}

	@acl.allow(reader, { read: true, when: { owner: { id: v } } })
	export class Child {
		label = def.stringColumn()
		parent = def.manyHasOne(Parent, 'child').notNull()
		owner = def.manyHasOne(Company).notNull()
	}
}
namespace M2M {
	export const reader = acl.createRole('reader')
	export const v = acl.createEntityVariable('company', 'Company', reader)

	@acl.allow(reader, { read: true, when: { id: v } })
	export class Company {
		name = def.stringColumn()
		parents = def.oneHasMany(Parent, 'company')
	}

	@acl.allow(reader, { read: true, when: { company: { id: v } } })
	export class Parent {
		name = def.stringColumn()
		company = def.manyHasOne(Company, 'parents').notNull()
		child = def.manyHasMany(Child)
	}

	@acl.allow(reader, { read: true, when: { visibility: { eq: 'public' } } })
	export class Child {
		label = def.stringColumn()
		visibility = def.stringColumn()
	}
}

test('MATRIX: to-one self-contained', async () => {
	await runMatrix({
		label: 'to-one/self',
		relField: 'child',
		schema: createSchema(ToOneSelf),
		setup: async t => {
			const company = await mkCompany(t, 'Co')
			await t(gql`mutation ($c: UUID!) { createParent(data: { name: "absent", company: { connect: { id: $c } } }) { ok } }`, {
				variables: { c: company },
			}).expect(200)
			await t(
				gql`mutation ($c: UUID!) { createParent(data: { name: "readable", company: { connect: { id: $c } }, child: { create: { label: "x", visibility: "public" } } }) { ok } }`,
				{ variables: { c: company } },
			).expect(200)
			await t(
				gql`mutation ($c: UUID!) { createParent(data: { name: "unreadable", company: { connect: { id: $c } }, child: { create: { label: "x", visibility: "private" } } }) { ok } }`,
				{ variables: { c: company } },
			).expect(200)
			return { company }
		},
	})
})
test('MATRIX: to-one multi-level', async () => {
	await runMatrix({
		label: 'to-one/deep',
		relField: 'child',
		schema: createSchema(ToOneDeep),
		setup: async t => {
			const company = await mkCompany(t, 'Co')
			const other = await mkCompany(t, 'Other')
			await t(gql`mutation ($c: UUID!) { createParent(data: { name: "absent", company: { connect: { id: $c } } }) { ok } }`, {
				variables: { c: company },
			}).expect(200)
			await t(
				gql`mutation ($c: UUID!) { createParent(data: { name: "readable", company: { connect: { id: $c } }, child: { create: { label: "x", owner: { connect: { id: $c } } } } }) { ok } }`,
				{ variables: { c: company } },
			).expect(200)
			await t(
				gql`mutation ($c: UUID!, $o: UUID!) { createParent(data: { name: "unreadable", company: { connect: { id: $c } }, child: { create: { label: "x", owner: { connect: { id: $o } } } } }) { ok } }`,
				{ variables: { c: company, o: other } },
			).expect(200)
			return { company }
		},
	})
})
test('MATRIX: oneHasMany self-contained', async () => {
	await runMatrix({
		label: 'oneHasMany/self',
		relField: 'child',
		schema: createSchema(ManySelf),
		setup: async t => {
			const company = await mkCompany(t, 'Co')
			await t(gql`mutation ($c: UUID!) { createParent(data: { name: "absent", company: { connect: { id: $c } } }) { ok } }`, {
				variables: { c: company },
			}).expect(200)
			await t(
				gql`mutation ($c: UUID!) { createParent(data: { name: "readable", company: { connect: { id: $c } }, child: { create: { label: "x", visibility: "public" } } }) { ok } }`,
				{ variables: { c: company } },
			).expect(200)
			await t(
				gql`mutation ($c: UUID!) { createParent(data: { name: "unreadable", company: { connect: { id: $c } }, child: { create: { label: "x", visibility: "private" } } }) { ok } }`,
				{ variables: { c: company } },
			).expect(200)
			return { company }
		},
	})
})
test('MATRIX: oneHasMany multi-level', async () => {
	await runMatrix({
		label: 'oneHasMany/deep',
		relField: 'child',
		schema: createSchema(ManyDeep),
		setup: async t => {
			const company = await mkCompany(t, 'Co')
			const other = await mkCompany(t, 'Other')
			await t(gql`mutation ($c: UUID!) { createParent(data: { name: "absent", company: { connect: { id: $c } } }) { ok } }`, {
				variables: { c: company },
			}).expect(200)
			await t(
				gql`mutation ($c: UUID!) { createParent(data: { name: "readable", company: { connect: { id: $c } }, child: { create: { label: "x", owner: { connect: { id: $c } } } } }) { ok } }`,
				{ variables: { c: company } },
			).expect(200)
			await t(
				gql`mutation ($c: UUID!, $o: UUID!) { createParent(data: { name: "unreadable", company: { connect: { id: $c } }, child: { create: { label: "x", owner: { connect: { id: $o } } } } }) { ok } }`,
				{ variables: { c: company, o: other } },
			).expect(200)
			return { company }
		},
	})
})
test('MATRIX: manyHasMany self-contained', async () => {
	await runMatrix({
		label: 'm2m/self',
		relField: 'child',
		schema: createSchema(M2M),
		setup: async t => {
			const company = await mkCompany(t, 'Co')
			await t(gql`mutation ($c: UUID!) { createParent(data: { name: "absent", company: { connect: { id: $c } } }) { ok } }`, {
				variables: { c: company },
			}).expect(200)
			await t(
				gql`mutation ($c: UUID!) { createParent(data: { name: "readable", company: { connect: { id: $c } }, child: { create: { label: "x", visibility: "public" } } }) { ok } }`,
				{ variables: { c: company } },
			).expect(200)
			await t(
				gql`mutation ($c: UUID!) { createParent(data: { name: "unreadable", company: { connect: { id: $c } }, child: { create: { label: "x", visibility: "private" } } }) { ok } }`,
				{ variables: { c: company } },
			).expect(200)
			return { company }
		},
	})
})
