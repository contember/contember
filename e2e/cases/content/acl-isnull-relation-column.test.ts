import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester.js'
import { AclDefinition as acl, createSchema, SchemaDefinition as def } from '@contember/schema-definition'

// The wrap used to make a childless parent match `{ children: { <col>: { isNull: true } } }` (the null-
// extended row had every column NULL). After removing the wrap it must mean "exists a READABLE child whose
// col is null" — childless parents must NOT match.
namespace M {
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
		children = def.oneHasMany(Child, 'parent')
	}

	@acl.allow(reader, { read: true, when: { visibility: { eq: 'public' } } })
	export class Child {
		note = def.stringColumn()
		visibility = def.stringColumn()
		parent = def.manyHasOne(Parent, 'children').notNull()
	}
}

test('col isNull on a relation does not match childless parents', async () => {
	const tester = await createTester(createSchema(M))
	const c = (await tester(gql`mutation { createCompany(data: { name: "Co" }) { node { id } } }`).expect(200)).body.data.createCompany.node.id
	await tester(gql`mutation ($c: UUID!) { createParent(data: { name: "childless", company: { connect: { id: $c } } }) { ok } }`, { variables: { c } })
		.expect(200)
	await tester(
		gql`mutation ($c: UUID!) { createParent(data: { name: "readableNullNote", company: { connect: { id: $c } }, children: { create: { visibility: "public" } } }) { ok } }`,
		{ variables: { c } },
	).expect(200)
	await tester(
		gql`mutation ($c: UUID!) { createParent(data: { name: "readableSetNote", company: { connect: { id: $c } }, children: { create: { note: "x", visibility: "public" } } }) { ok } }`,
		{ variables: { c } },
	).expect(200)
	await tester(
		gql`mutation ($c: UUID!) { createParent(data: { name: "unreadableNullNote", company: { connect: { id: $c } }, children: { create: { visibility: "private" } } }) { ok } }`,
		{ variables: { c } },
	).expect(200)

	const email = `reader${Date.now()}@doe.com`
	const id = await tester.tenant.signUp(email)
	const key = await tester.tenant.signIn(email)
	await tester.tenant.addProjectMember(id, tester.projectSlug, { role: 'reader', variables: [{ name: 'company', values: [c] }] })

	const q = gql`query ($f: ParentWhere) { listParent(filter: $f, orderBy: [{ name: asc }]) { name } }`
	const res =
		(await tester(q, { variables: { f: { children: { note: { isNull: true } } } }, authorizationToken: key }).expect(200)).body.data.listParent
	const names = res.map((p: any) => p.name).sort()
	console.log('col-isNull { children: { note: isNull } } →', JSON.stringify(names))
	// Semantic 2: only the parent with a READABLE child whose note is null. NOT childless, NOT unreadable.
	expect(names).toEqual(['readableNullNote'])
})
