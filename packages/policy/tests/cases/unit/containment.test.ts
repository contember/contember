import { describe, expect, test } from 'bun:test'
import {
	computeGrantableSurface,
	findUngrantableCells,
	globIntersects,
	globSubsumes,
	isCellGrantable,
	maxExpand,
	Policy,
	Statement,
} from '../../../src'

describe('globSubsumes', () => {
	test('wildcard subsumes anything', () => {
		expect(globSubsumes('*', 'tenant:project.create')).toBe(true)
		expect(globSubsumes('*', '*')).toBe(true)
		expect(globSubsumes('*', 'a?c')).toBe(true)
	})

	test('prefix wildcard subsumes a narrower wildcard', () => {
		expect(globSubsumes('tenant:*', 'tenant:project.*')).toBe(true)
		expect(globSubsumes('tenant:project.*', 'tenant:project.create')).toBe(true)
	})

	test('a concrete pattern does NOT subsume a wildcard', () => {
		expect(globSubsumes('tenant:project.create', 'tenant:project.*')).toBe(false)
		expect(globSubsumes('tenant:project.*', 'tenant:*')).toBe(false)
	})

	test('exact match', () => {
		expect(globSubsumes('a.b.c', 'a.b.c')).toBe(true)
		expect(globSubsumes('a.b.c', 'a.b.d')).toBe(false)
	})

	test('? covers one literal char but not a star', () => {
		expect(globSubsumes('a?c', 'abc')).toBe(true)
		expect(globSubsumes('a?c', 'a?c')).toBe(true)
		expect(globSubsumes('a?c', 'a*c')).toBe(false)
		expect(globSubsumes('a?c', 'ac')).toBe(false)
	})

	test('trailing star can match empty', () => {
		expect(globSubsumes('a*', 'a')).toBe(true)
		expect(globSubsumes('a', 'a*')).toBe(false)
	})
})

describe('globIntersects', () => {
	test('overlapping wildcards intersect', () => {
		expect(globIntersects('a*', '*b')).toBe(true)
		expect(globIntersects('tenant:project.*', 'tenant:*')).toBe(true)
		expect(globIntersects('tenant:identity.*', 'tenant:identity.addGlobalRoles')).toBe(true)
	})

	test('disjoint literals do not intersect', () => {
		expect(globIntersects('tenant:idp.add', 'tenant:identity.viewPermissions')).toBe(false)
		expect(globIntersects('tenant:project.create', 'tenant:project.update')).toBe(false)
	})

	test('is symmetric', () => {
		expect(globIntersects('tenant:*', 'tenant:idp.add')).toBe(globIntersects('tenant:idp.add', 'tenant:*'))
	})
})

describe('maxExpand', () => {
	test('replaces placeholders with *', () => {
		expect(maxExpand('project:${assignment.tags.project}')).toBe('project:*')
		expect(maxExpand('${a}')).toBe('*')
		expect(maxExpand('tenant:idp.add')).toBe('tenant:idp.add')
	})
})

const allow = (actions: string[], resources?: string[], conditions?: Statement['conditions']): Statement => ({
	effect: 'allow',
	actions,
	resources,
	conditions,
})
const deny = (actions: string[], resources?: string[], conditions?: Statement['conditions']): Statement => ({
	effect: 'deny',
	actions,
	resources,
	conditions,
})
const doc = (...statements: Statement[]): Policy => ({ statements })

describe('computeGrantableSurface', () => {
	test('unconditional allows form the surface', () => {
		const s = computeGrantableSurface([allow(['tenant:idp.add', 'tenant:idp.list'], ['*'])])
		expect(s.allow).toEqual([
			{ action: 'tenant:idp.add', resource: '*' },
			{ action: 'tenant:idp.list', resource: '*' },
		])
		expect(s.deny).toEqual([])
	})

	test('conditional allows are dropped', () => {
		const s = computeGrantableSurface([
			allow(['tenant:project.addMember'], ['*'], { stringEquals: { 'subject.membership.role': 'editor' } }),
		])
		expect(s.allow).toEqual([])
	})

	test('allows with unresolved placeholders are dropped', () => {
		const s = computeGrantableSurface([allow(['tenant:idp.add'], ['idp:${assignment.tags.x}'])])
		expect(s.allow).toEqual([])
	})

	test('denies subtract regardless of condition, widened to *', () => {
		const s = computeGrantableSurface([deny(['tenant:identity.addGlobalRoles'], ['idp:${x}'], { stringEquals: { a: 'b' } })])
		expect(s.deny).toEqual([{ action: 'tenant:identity.addGlobalRoles', resource: 'idp:*' }])
	})

	test('missing resources default to *', () => {
		const s = computeGrantableSurface([allow(['tenant:idp.add'])])
		expect(s.allow).toEqual([{ action: 'tenant:idp.add', resource: '*' }])
	})
})

// Surface mirroring a project_admin who was *also* granted policy.* — its
// unconditional allow list minus the deny-guarded actions.
const projectAdminish = computeGrantableSurface([
	allow(
		[
			'tenant:idp.add',
			'tenant:idp.update',
			'tenant:idp.list',
			'tenant:mailTemplate.add',
			'tenant:mailTemplate.list',
			'tenant:identity.addGlobalRoles', // present in allow ...
			'tenant:policy.create',
			'tenant:policy.assign',
		],
		['*'],
	),
	// ... but guarded by a deny, so it must drop out of the grantable surface
	deny(['tenant:identity.addGlobalRoles'], ['*'], { 'forAnyValue:stringNotEquals': { 'subject.roles': ['login'] } }),
])

describe('findUngrantableCells — ALLOWED (within surface)', () => {
	test('granting a subset of own actions passes', () => {
		expect(findUngrantableCells(projectAdminish, doc(allow(['tenant:idp.add', 'tenant:mailTemplate.add'], ['*'])))).toEqual([])
	})

	test('granting on a narrower resource passes (allow is on *)', () => {
		expect(findUngrantableCells(projectAdminish, doc(allow(['tenant:idp.add'], ['project:blog'])))).toEqual([])
	})

	test('a deny-only policy whose actions are within surface passes', () => {
		expect(findUngrantableCells(projectAdminish, doc(deny(['tenant:idp.add'], ['*'])))).toEqual([])
	})

	test('super admin (allow * on *) can grant anything', () => {
		const su = computeGrantableSurface([allow(['*'], ['*'])])
		expect(findUngrantableCells(su, doc(allow(['tenant:project.create', '*'], ['*'])))).toEqual([])
		expect(findUngrantableCells(su, doc(deny(['tenant:identity.addGlobalRoles'], ['*'])))).toEqual([])
	})
})

describe('findUngrantableCells — INTENTIONALLY REJECTED (would escalate)', () => {
	test('granting an action outside the surface', () => {
		const v = findUngrantableCells(projectAdminish, doc(allow(['tenant:project.create'], ['*'])))
		expect(v).toEqual([{ action: 'tenant:project.create', resource: '*' }])
	})

	test('granting a deny-guarded action (un-deny / direct grant) is rejected', () => {
		const v = findUngrantableCells(projectAdminish, doc(allow(['tenant:identity.addGlobalRoles'], ['*'])))
		expect(v).toEqual([{ action: 'tenant:identity.addGlobalRoles', resource: '*' }])
	})

	test('removing a deny on a guarded action is rejected (same cell, any effect)', () => {
		const v = findUngrantableCells(projectAdminish, doc(deny(['tenant:identity.addGlobalRoles'], ['*'])))
		expect(v).toEqual([{ action: 'tenant:identity.addGlobalRoles', resource: '*' }])
	})

	test('a wildcard grant that reaches beyond the surface is rejected', () => {
		const v = findUngrantableCells(projectAdminish, doc(allow(['tenant:identity.*'], ['*'])))
		expect(v).toEqual([{ action: 'tenant:identity.*', resource: '*' }])
	})

	test('granting on a broader resource than the surface allows', () => {
		const scoped = computeGrantableSurface([allow(['tenant:idp.add'], ['project:blog'])])
		expect(findUngrantableCells(scoped, doc(allow(['tenant:idp.add'], ['project:blog'])))).toEqual([])
		expect(findUngrantableCells(scoped, doc(allow(['tenant:idp.add'], ['*'])))).toEqual([
			{ action: 'tenant:idp.add', resource: '*' },
		])
	})
})

describe('findUngrantableCells — KNOWN LIMITATION (sound but stricter than necessary)', () => {
	// These COULD be allowed with richer logic, but v1 rejects them. Documented
	// so the behavior is intentional, not an accident — revisit if it bites.

	test('enumerated surface does not cover an equivalent wildcard grant', () => {
		// Surface lists every project verb individually; grant asks for `project.*`.
		// No single surface cell subsumes the wildcard, so it is rejected even
		// though the union of verbs would cover it.
		const enumerated = computeGrantableSurface([allow(['tenant:project.create', 'tenant:project.update', 'tenant:project.view'], ['*'])])
		expect(findUngrantableCells(enumerated, doc(allow(['tenant:project.*'], ['*'])))).toEqual([
			{ action: 'tenant:project.*', resource: '*' },
		])
	})

	test('tag-parameterized resource cannot be authored by a resource-scoped actor', () => {
		// `idp:${tags.x}` widens to `idp:*` for the check; a surface scoped to
		// `idp:blog-*` cannot bound it, so authoring is rejected. Only a wildcard
		// surface on that resource could grant it.
		const scoped = computeGrantableSurface([allow(['tenant:idp.add'], ['idp:blog-*'])])
		expect(findUngrantableCells(scoped, doc(allow(['tenant:idp.add'], ['idp:${assignment.tags.x}'])))).toEqual([
			{ action: 'tenant:idp.add', resource: 'idp:*' },
		])
	})

	test('a conditional allow in the actor’s own policy is not credited', () => {
		// Even though the actor *can* addMember (under a membership condition),
		// that conditional allow is dropped from the surface, so it cannot be
		// re-granted via a free-standing policy. (By design — membership
		// delegation belongs in the project schema.)
		const memberAdmin = computeGrantableSurface([
			allow(['tenant:project.addMember'], ['*'], { stringEquals: { 'subject.membership.role': 'editor' } }),
		])
		expect(findUngrantableCells(memberAdmin, doc(allow(['tenant:project.addMember'], ['*'])))).toEqual([
			{ action: 'tenant:project.addMember', resource: '*' },
		])
	})
})

describe('findUngrantableCells — soundness corner cases', () => {
	test('coverage cannot be stitched across two surface cells', () => {
		// action from one allow + resource from another must NOT combine: the
		// actor can do idp.add on project:a and idp.list on project:b, but NOT
		// idp.add on project:b.
		const s = computeGrantableSurface([
			allow(['tenant:idp.add'], ['project:a']),
			allow(['tenant:idp.list'], ['project:b']),
		])
		expect(findUngrantableCells(s, doc(allow(['tenant:idp.add'], ['project:a'])))).toEqual([])
		expect(findUngrantableCells(s, doc(allow(['tenant:idp.add'], ['project:b'])))).toEqual([
			{ action: 'tenant:idp.add', resource: 'project:b' },
		])
	})

	test('a resource-scoped deny subtracts only overlapping resources', () => {
		const s = computeGrantableSurface([allow(['tenant:idp.add'], ['*']), deny(['tenant:idp.add'], ['idp:secret-*'])])
		// disjoint resource is fine
		expect(findUngrantableCells(s, doc(allow(['tenant:idp.add'], ['idp:public-1'])))).toEqual([])
		// resource overlapping the deny is blocked
		expect(findUngrantableCells(s, doc(allow(['tenant:idp.add'], ['idp:secret-1'])))).toEqual([
			{ action: 'tenant:idp.add', resource: 'idp:secret-1' },
		])
		// a wildcard resource intersects the deny -> blocked
		expect(findUngrantableCells(s, doc(allow(['tenant:idp.add'], ['*'])))).toEqual([
			{ action: 'tenant:idp.add', resource: '*' },
		])
	})

	test('an unconditional allow survives alongside a conditional one for the same action', () => {
		const s = computeGrantableSurface([
			allow(['tenant:project.addMember'], ['*']),
			allow(['tenant:project.addMember'], ['*'], { stringEquals: { 'subject.membership.role': 'editor' } }),
		])
		expect(s.allow).toEqual([{ action: 'tenant:project.addMember', resource: '*' }])
		expect(findUngrantableCells(s, doc(allow(['tenant:project.addMember'], ['*'])))).toEqual([])
	})

	test('a broad deny in the actor’s own policy collapses its surface', () => {
		// A single wildcard deny (even conditional) wipes the grantable surface —
		// conservative, and worth pinning so it is a known consequence.
		const s = computeGrantableSurface([allow(['tenant:idp.add'], ['*']), deny(['tenant:*'], ['*'], { bool: { x: true } })])
		expect(findUngrantableCells(s, doc(allow(['tenant:idp.add'], ['*'])))).toEqual([
			{ action: 'tenant:idp.add', resource: '*' },
		])
	})
})

describe('isCellGrantable', () => {
	test('deny intersection blocks an otherwise-allowed cell', () => {
		const surface = computeGrantableSurface([allow(['tenant:identity.*'], ['*']), deny(['tenant:identity.addGlobalRoles'], ['*'])])
		expect(isCellGrantable(surface, { action: 'tenant:identity.viewPermissions', resource: '*' })).toBe(true)
		expect(isCellGrantable(surface, { action: 'tenant:identity.addGlobalRoles', resource: '*' })).toBe(false)
		// the wildcard cell intersects the deny -> blocked
		expect(isCellGrantable(surface, { action: 'tenant:identity.*', resource: '*' })).toBe(false)
	})
})
