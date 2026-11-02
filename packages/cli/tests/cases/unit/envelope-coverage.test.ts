import { describe, expect, test } from 'bun:test'
import { Acl } from '@contember/schema'
import { describeEnvelopeCoverageIssue, findUncoveredEnvelopeRules } from '../../../src/lib/tenant/workloadIdentity/envelopeCoverage.js'
import type { RemoteWorkloadIdentityMembership, RemoteWorkloadIdentityTrust } from '../../../src/lib/tenant/workloadIdentity/model.js'

const acl: Acl.Schema = {
	roles: {
		editor: {
			variables: {
				site: { type: Acl.VariableType.entity, entityName: 'Site' },
				locale: { type: Acl.VariableType.condition },
				self: { type: Acl.VariableType.predefined, value: 'identityID' },
			},
			entities: {},
		},
		reader: { variables: {}, entities: {} },
	},
}

const trust = (memberships: RemoteWorkloadIdentityMembership[], disabled = false): RemoteWorkloadIdentityTrust => ({
	id: 'id',
	slug: 'sync',
	profile: 'oidc',
	issuer: 'https://auth.example.com',
	audience: 'contember:test:sync',
	jwksUri: null,
	signingAlgs: ['RS256', 'ES256'],
	acceptedTyp: ['JWT', null],
	acceptAudienceArray: false,
	requireDpop: false,
	conditions: [{ claim: 'sub', equals: 'sync' }],
	maxTokenLifetime: 3600,
	trustForwardedInfo: false,
	description: null,
	disabled,
	tokensValidAfter: '2026-10-01T00:00:00.000Z',
	roles: [],
	memberships,
})

const membership = (assumeMembership: Acl.MembershipMatchRule | null, project = 'sites'): RemoteWorkloadIdentityMembership => ({
	project,
	role: 'sync',
	variables: [{ name: 'site', values: ['blog'] }],
	assumeMembership,
})

describe('envelope coverage', () => {
	test('lists the entity and condition variables a rule does not name; predefined ones are never required', () => {
		const issues = findUncoveredEnvelopeRules([trust([membership({ editor: { variables: { site: 'site' } } })])], 'sites', acl)

		expect(issues).toEqual([{
			trust: 'sync',
			project: 'sites',
			membershipRole: 'sync',
			targetRole: 'editor',
			kind: 'variables-uncovered',
			variables: ['locale'],
		}])
		expect(issues.map(describeEnvelopeCoverageIssue)).toEqual([
			'Workload identity sync: the envelope rule on sites/sync for role editor does not name variable(s) locale of the new schema; assuming it will be refused (403) until the rule names them.',
		])
	})

	test('a rule without variables names none of them', () => {
		const issues = findUncoveredEnvelopeRules([trust([membership({ editor: {} })])], 'sites', acl)

		expect(issues.map(it => it.kind === 'variables-uncovered' ? it.variables : it.kind)).toEqual([['site', 'locale']])
	})

	test('a removed role is reported', () => {
		const issues = findUncoveredEnvelopeRules([trust([membership({ admin: true })])], 'sites', acl)

		expect(issues).toEqual([{ trust: 'sync', project: 'sites', membershipRole: 'sync', targetRole: 'admin', kind: 'role-missing' }])
		expect(issues.map(describeEnvelopeCoverageIssue)).toEqual([
			'Workload identity sync: the envelope rule on sites/sync for role admin targets a role the new schema no longer defines.',
		])
	})

	test('unbounded rules, fully named rules and roles without variables are covered', () => {
		const rules: Acl.MembershipMatchRule[] = [
			true,
			false,
			{ editor: true },
			{ editor: { variables: true } },
			{ editor: { variables: { site: 'site', locale: true } } },
			{ reader: {} },
		]
		for (const rule of rules) {
			expect(findUncoveredEnvelopeRules([trust([membership(rule)])], 'sites', acl)).toEqual([])
		}
	})

	test('ignores disabled trusts, memberships without a rule and other projects', () => {
		const uncovered: Acl.MembershipMatchRule = { editor: {} }

		expect(findUncoveredEnvelopeRules([trust([membership(uncovered)], true)], 'sites', acl)).toEqual([])
		expect(findUncoveredEnvelopeRules([trust([membership(null)])], 'sites', acl)).toEqual([])
		expect(findUncoveredEnvelopeRules([trust([membership(uncovered, 'other')])], 'sites', acl)).toEqual([])
	})
})
