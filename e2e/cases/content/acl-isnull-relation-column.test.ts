import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester.js'
import { AclDefinition as acl, createSchema, SchemaDefinition as def } from '@contember/schema-definition'

// `{ children: { <col>: { isNull: true } } }` matches a childless parent (the null-extended row of the
// has-many join has every column NULL). Children are joined through their read-guarded source, so a parent
// whose only children are unreadable is null-extended the same way: it matches exactly like a childless one,
// and the filter means the same thing for every role.
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

test('col isNull on a has-many relation treats unreadable-only children like no children, for every role', async () => {
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
	const filter = { children: { note: { isNull: true } } }
	const asReader = (await tester(q, { variables: { f: filter }, authorizationToken: key }).expect(200)).body.data.listParent
	const asRoot = (await tester(q, { variables: { f: filter } }).expect(200)).body.data.listParent
	const names = (rows: any[]) => rows.map(p => p.name).sort()
	// childless: null-extended row; readableNullNote: a readable child with a null note;
	// unreadableNullNote: its only child is unreadable, so it null-extends exactly like childless
	expect(names(asReader)).toEqual(['childless', 'readableNullNote', 'unreadableNullNote'])
	// the filter is not role-dependent: root reads the private child (note null) and gets the same set
	expect(names(asRoot)).toEqual(names(asReader))
})
