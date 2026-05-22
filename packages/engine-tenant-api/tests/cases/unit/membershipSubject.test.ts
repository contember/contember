import { describe, expect, test } from 'bun:test'
import type { Acl } from '@contember/schema'
import { PolicyEngine } from '@contember/policy'
import { buildMembershipSubject, ProjectSchemaPolicyProvider, TenantActions, TenantResources } from '../../../src/model/policy'

describe('buildMembershipSubject', () => {
	test('translates array-of-{name,values} into a flat object', () => {
		const subject = buildMembershipSubject({
			role: 'editor',
			variables: [
				{ name: 'team', values: ['eng', 'platform'] },
				{ name: 'dept', values: ['ops'] },
			],
		})
		expect(subject).toEqual({
			role: 'editor',
			variables: { team: ['eng', 'platform'], dept: ['ops'] },
		})
	})

	test('empty variables → empty object (not undefined)', () => {
		const subject = buildMembershipSubject({ role: 'viewer', variables: [] })
		expect(subject).toEqual({ role: 'viewer', variables: {} })
	})
})

describe('ProjectSchemaPolicyProvider requires the buildMembershipSubject shape', () => {
	const acl: Acl.Schema = {
		roles: {
			editor: {
				entities: {},
				tenant: {
					manage: {
						editor: { variables: { team: 'team' } },
					},
				},
			},
		},
	} as any

	const invoker: Acl.Membership = {
		role: 'editor',
		variables: [{ name: 'team', values: ['eng'] }],
	}
	const subjectOutsideAllowedValues: Acl.Membership = {
		role: 'editor',
		variables: [{ name: 'team', values: ['ops'] }],
	}

	const evaluate = async (subjectShape: unknown): Promise<'allow' | 'deny'> => {
		const provider = new ProjectSchemaPolicyProvider({
			slug: 'webmaster',
			acl,
			memberships: [invoker],
		})
		const engine = new PolicyEngine([provider])
		const result = await engine.evaluate(
			TenantActions.projectAddMember,
			TenantResources.project('webmaster'),
			{ subject: { membership: subjectShape } },
		)
		return result.decision
	}

	test('correctly-translated subject → denies when subject values are outside invoker values', async () => {
		expect(await evaluate(buildMembershipSubject(subjectOutsideAllowedValues))).toBe('deny')
	})

	test('correctly-translated subject → allows when subject values are subset of invoker values', async () => {
		const subjectInsideAllowedValues: Acl.Membership = {
			role: 'editor',
			variables: [{ name: 'team', values: ['eng'] }],
		}
		expect(await evaluate(buildMembershipSubject(subjectInsideAllowedValues))).toBe('allow')
	})

	test('raw Acl.Membership shape would deny EVERYTHING (forAllKeys sees array indices)', async () => {
		// When a caller forgets to translate, the engine reads
		// `Object.keys([{name:'team', ...}])` → `['0']`, which never matches the
		// allow-listed variable names, so `forAllKeys:stringEquals` rejects the
		// statement and the request denies. This is conservatively safe (no
		// permission leak), but DOES yield wrong-deny under value matching —
		// hence callers must use buildMembershipSubject for correct decisions.
		const subjectInsideAllowedValues: Acl.Membership = {
			role: 'editor',
			variables: [{ name: 'team', values: ['eng'] }],
		}
		expect(await evaluate(subjectInsideAllowedValues)).toBe('deny')
	})
})
