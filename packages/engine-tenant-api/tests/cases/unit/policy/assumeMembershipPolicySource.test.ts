import { describe, expect, test } from 'bun:test'
import { PolicyEngine } from '@contember/policy'
import { Acl } from '@contember/schema'
import { ASSUME_MEMBERSHIP_ACTION, AssumeMembershipPolicySource, buildMembershipSubject } from '../../../../src/model/policy'

const projectSlug = 'webmaster'
const resource = `project:${projectSlug}`

const decide = async (
	acl: Acl.Schema,
	invokerMemberships: readonly Acl.Membership[],
	assumed: Acl.Membership,
): Promise<boolean> => {
	const source = new AssumeMembershipPolicySource(
		{ slug: projectSlug, acl: acl },
		invokerMemberships,
	)
	const engine = new PolicyEngine([source])
	return engine.isAllowed(ASSUME_MEMBERSHIP_ACTION, resource, {
		subject: { membership: buildMembershipSubject(assumed) },
	})
}

describe('AssumeMembershipPolicySource', () => {
	test('empty invoker memberships — deny', async () => {
		const acl: Acl.Schema = {
			roles: {
				editor: { entities: {}, content: { assumeMembership: { viewer: true } } },
			},
		} as any
		expect(await decide(acl, [], { role: 'viewer', variables: [] })).toBe(false)
	})

	test('invoker with assumeMembership = {editor: true} — allow editor, deny viewer', async () => {
		const acl: Acl.Schema = {
			roles: {
				admin: { entities: {}, content: { assumeMembership: { editor: true } } },
			},
		} as any
		const invoker: Acl.Membership[] = [{ role: 'admin', variables: [] }]

		expect(await decide(acl, invoker, { role: 'editor', variables: [] })).toBe(true)
		expect(await decide(acl, invoker, { role: 'viewer', variables: [] })).toBe(false)
	})

	test('invoker rule with variable constraint — subset allowed, superset denied', async () => {
		const acl: Acl.Schema = {
			roles: {
				admin: {
					entities: {},
					content: {
						assumeMembership: {
							editor: { variables: { team: 'team' } },
						},
					},
				},
			},
		} as any
		const invoker: Acl.Membership[] = [
			{ role: 'admin', variables: [{ name: 'team', values: ['eng', 'platform'] }] },
		]

		// subject team values are a subset of invoker's allowed values
		expect(
			await decide(acl, invoker, {
				role: 'editor',
				variables: [{ name: 'team', values: ['eng'] }],
			}),
		).toBe(true)

		// subject team value not in invoker's set
		expect(
			await decide(acl, invoker, {
				role: 'editor',
				variables: [{ name: 'team', values: ['ops'] }],
			}),
		).toBe(false)
	})

	test('invoker lacks the mapped variable — deny subject carrying it, even with empty values', async () => {
		const acl: Acl.Schema = {
			roles: {
				admin: {
					entities: {},
					content: {
						assumeMembership: {
							editor: { variables: { team: 'team' } },
						},
					},
				},
			},
		} as any
		// invoker has the role but NOT the mapped `team` variable
		const invoker: Acl.Membership[] = [{ role: 'admin', variables: [] }]

		// subject carries `team` with non-empty values → deny
		expect(
			await decide(acl, invoker, {
				role: 'editor',
				variables: [{ name: 'team', values: ['eng'] }],
			}),
		).toBe(false)

		// subject carries `team` with an EMPTY value list → still deny (matches legacy matcher)
		expect(
			await decide(acl, invoker, {
				role: 'editor',
				variables: [{ name: 'team', values: [] }],
			}),
		).toBe(false)

		// subject does not carry `team` at all → allow
		expect(await decide(acl, invoker, { role: 'editor', variables: [] })).toBe(true)
	})

	test('invoker has the mapped variable with empty values — allow only empty subject', async () => {
		const acl: Acl.Schema = {
			roles: {
				admin: {
					entities: {},
					content: {
						assumeMembership: {
							editor: { variables: { team: 'team' } },
						},
					},
				},
			},
		} as any
		// invoker DOES carry `team`, but with no allowed values
		const invoker: Acl.Membership[] = [{ role: 'admin', variables: [{ name: 'team', values: [] }] }]

		// subject with empty values → subset of empty → allow
		expect(
			await decide(acl, invoker, {
				role: 'editor',
				variables: [{ name: 'team', values: [] }],
			}),
		).toBe(true)

		// subject with any value → not a subset of empty → deny
		expect(
			await decide(acl, invoker, {
				role: 'editor',
				variables: [{ name: 'team', values: ['eng'] }],
			}),
		).toBe(false)
	})

	test('subject carries a variable not in the rule — deny (shape constraint)', async () => {
		const acl: Acl.Schema = {
			roles: {
				admin: {
					entities: {},
					content: {
						assumeMembership: {
							editor: { variables: { team: 'team' } },
						},
					},
				},
			},
		} as any
		const invoker: Acl.Membership[] = [
			{ role: 'admin', variables: [{ name: 'team', values: ['eng'] }] },
		]

		expect(
			await decide(acl, invoker, {
				role: 'editor',
				variables: [
					{ name: 'team', values: ['eng'] },
					{ name: 'dept', values: ['x'] },
				],
			}),
		).toBe(false)
	})

	test('multiple invoker memberships — one matches → allow', async () => {
		const acl: Acl.Schema = {
			roles: {
				roleA: { entities: {}, content: { assumeMembership: { admin: { admin: true } } } as any },
				roleB: { entities: {}, content: { assumeMembership: { editor: true } } },
			},
		} as any
		const invoker: Acl.Membership[] = [
			{ role: 'roleA', variables: [] },
			{ role: 'roleB', variables: [] },
		]

		// only roleB's rule allows editor — but the union should allow
		expect(await decide(acl, invoker, { role: 'editor', variables: [] })).toBe(true)
		// no rule allows viewer
		expect(await decide(acl, invoker, { role: 'viewer', variables: [] })).toBe(false)
	})

	test('invoker role missing content.assumeMembership — deny', async () => {
		const acl: Acl.Schema = {
			roles: {
				editor: { entities: {} },
			},
		} as any
		const invoker: Acl.Membership[] = [{ role: 'editor', variables: [] }]
		expect(await decide(acl, invoker, { role: 'viewer', variables: [] })).toBe(false)
	})
})
