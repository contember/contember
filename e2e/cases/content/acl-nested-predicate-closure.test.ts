import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester.js'
import { AclDefinition as acl, createSchema, SchemaDefinition as def } from '@contember/schema-definition'

// Regression for the recursive-ACL-closure gap (PredicatesInjector.injectPredicatesToPredicate):
// a row-level read predicate whose OWN target entity's predicate traverses a further to-one relation used to
// append that target predicate RAW, so the further entity's readability was never enforced — a readable-view
// leak. Chain: Parent.read = {room:{name:"anchor"}}, Room.read = {building:{code:"B1"}}, and Building has an
// INDEPENDENT scalar predicate {open: true}. A Parent whose room's building is code=B1 but open=FALSE must be
// invisible (building unreadable ⇒ room unreadable ⇒ parent has no readable "anchor" room). Before the fix the
// parent leaked as visible because Building.read ({open:true}) was not injected under Room.read.
//
// Metamorphic core: the reader's restricted view must be invariant to the CONTENTS of unreadable rows — two
// dataset states that differ only in a hidden (open=false) building's fields must yield byte-identical reader
// responses, and filter / projection / totalCount must all agree.

namespace NestedClosure {
	export const reader = acl.createRole('reader')

	// Parent readable iff it has a READABLE room named "anchor".
	@acl.allow(reader, { read: true, when: { room: { name: { eq: 'anchor' } } } })
	export class Parent {
		tag = def.stringColumn()
		room = def.manyHasOne(Room).notNull()
	}

	// Room readable iff it has a READABLE building with code "B1".
	@acl.allow(reader, { read: true, when: { building: { code: { eq: 'B1' } } } })
	export class Room {
		name = def.stringColumn()
		building = def.manyHasOne(Building).notNull()
	}

	// Building has an INDEPENDENT scalar predicate: only open buildings are readable.
	@acl.allow(reader, { read: true, when: { open: { eq: true } } })
	export class Building {
		code = def.stringColumn()
		open = def.boolColumn()
	}
}

const mk = async (t: any, q: string, variables: any = {}) => (await t(q, { variables }).expect(200)).body.data
const tags = (rows: any[]) => rows.map(r => r.tag).sort()

test('recursive ACL closure: nested target-entity predicate readability is enforced (readable view)', async () => {
	const tester = await createTester(createSchema(NestedClosure))

	const openB = (await mk(tester, gql`mutation { createBuilding(data: { code: "B1", open: true }) { node { id } } }`)).createBuilding.node.id
	const hiddenB = (await mk(tester, gql`mutation { createBuilding(data: { code: "B1", open: false }) { node { id } } }`)).createBuilding.node.id

	// visible: room's building is readable (open) with code B1.
	await mk(
		tester,
		gql`mutation ($b: UUID!) { createParent(data: { tag: "visible", room: { create: { name: "anchor", building: { connect: { id: $b } } } } }) { ok } }`,
		{ b: openB },
	)
	// hidden: room's building is UNREADABLE (open=false) — parent must be invisible to the reader.
	await mk(
		tester,
		gql`mutation ($b: UUID!) { createParent(data: { tag: "hidden", room: { create: { name: "anchor", building: { connect: { id: $b } } } } }) { ok } }`,
		{ b: hiddenB },
	)

	const email = `closure${Date.now()}@doe.com`
	const identityId = await tester.tenant.signUp(email)
	const authKey = await tester.tenant.signIn(email)
	await tester.tenant.addProjectMember(identityId, tester.projectSlug, { role: 'reader', variables: [] })

	const readAll = async () => {
		const list =
			(await tester(gql`query { listParent(orderBy: [{ tag: asc }]) { tag room { name } } }`, { authorizationToken: authKey }).expect(200)).body.data
				.listParent
		const meta =
			(await tester(gql`query { paginateParent { pageInfo { totalCount } } }`, { authorizationToken: authKey }).expect(200)).body.data.paginateParent
				.pageInfo.totalCount
		return { list, meta }
	}
	const filterMatch = async (filter: any) => {
		const q = gql`query ($filter: ParentWhere) { listParent(filter: $filter, orderBy: [{ tag: asc }]) { tag } }`
		return tags((await tester(q, { variables: { filter }, authorizationToken: authKey }).expect(200)).body.data.listParent)
	}

	// State A: hidden building open=false.
	const a = await readAll()
	expect(tags(a.list), 'only the readable-building parent is visible').toEqual(['visible'])
	expect(a.list.every((p: any) => p.room != null), 'every visible parent has a readable room').toBe(true)
	expect(a.meta, 'totalCount agrees with the readable node set').toBe(1)

	// Filter / projection agreement over the readable view.
	expect(await filterMatch({ room: { name: { eq: 'anchor' } } }), 'positive room filter matches only readable').toEqual(['visible'])
	expect(await filterMatch({ room: { id: { isNull: false } } }), 'isNull:false matches only readable room').toEqual(['visible'])
	expect(await filterMatch({ not: { room: { id: { isNull: true } } } }), 'not(isNull) == readable').toEqual(['visible'])

	// Metamorphic: mutate ONLY the hidden building's fields (still open=false). The reader view must not change.
	await mk(tester, gql`mutation ($b: UUID!) { updateBuilding(by: { id: $b }, data: { code: "MUTATED" }) { ok } }`, { b: hiddenB })
	const b = await readAll()
	expect(tags(b.list), 'reader view invariant to hidden-building mutation').toEqual(tags(a.list))
	expect(b.meta, 'totalCount invariant to hidden-building mutation').toBe(a.meta)
	expect(await filterMatch({ room: { name: { eq: 'anchor' } } }), 'filter invariant to hidden-building mutation').toEqual(['visible'])
})
