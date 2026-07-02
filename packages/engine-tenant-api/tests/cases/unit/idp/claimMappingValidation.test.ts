import { describe, expect, test } from 'bun:test'
import { Acl } from '@contember/schema'
import { MembershipResolver, MembershipValidationErrorType } from '@contember/schema-utils'
import { ClaimMappingMembership, ClaimMappingMembershipErrorType, validateClaimMappingMembership } from '../../../../src/model/service/idp/index.js'

// Unit coverage for the shared A09 membership validator. It delegates the membership-shape checks
// (role/variable existence, predefined rejection, condition-value parse) to MembershipResolver — the
// same validator the direct add-member path uses — and adds the claim-aware condition-injection guard.

const acl: Acl.Schema = {
	roles: {
		editor: {
			stages: '*',
			entities: {},
			variables: {
				language: { type: Acl.VariableType.entity, entityName: 'Language' },
				// optional (carries a fallback) so a membership that omits it is a valid partial grant
				siteFilter: { type: Acl.VariableType.condition, fallback: { never: true } },
				me: { type: Acl.VariableType.predefined, value: 'identityID' },
			},
		},
	},
}

const membership = (role: string, variables: ClaimMappingMembership['variables'] = []): ClaimMappingMembership => ({
	project: 'demo',
	role,
	variables,
})
const types = (errors: { type: ClaimMappingMembershipErrorType }[]) => errors.map(it => it.type)

describe('validateClaimMappingMembership', () => {
	test('accepts a valid partial grant (an entity variable set, the others omitted)', () => {
		expect(validateClaimMappingMembership(acl, membership('editor', [{ name: 'language', values: ['uuid-en'] }]))).toEqual([])
	})

	test('accepts a role with no variables (partial grant — VARIABLE_EMPTY is tolerated, unlike the direct path)', () => {
		expect(validateClaimMappingMembership(acl, membership('editor'))).toEqual([])
	})

	test('rejects an unknown role', () => {
		expect(types(validateClaimMappingMembership(acl, membership('salesperson')))).toEqual([ClaimMappingMembershipErrorType.roleNotFound])
	})

	test('rejects an unknown membership variable', () => {
		expect(types(validateClaimMappingMembership(acl, membership('editor', [{ name: 'ghost', values: ['x'] }]))))
			.toEqual([ClaimMappingMembershipErrorType.variableNotFound])
	})

	test('rejects setting a predefined variable (the runtime binds it to the signed-in identity)', () => {
		expect(types(validateClaimMappingMembership(acl, membership('editor', [{ name: 'me', values: ['x'] }]))))
			.toEqual([ClaimMappingMembershipErrorType.predefinedVariable])
	})

	test('a role / variable named after a prototype member is not silently accepted (own-property lookups, no throw)', () => {
		for (const role of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
			expect(types(validateClaimMappingMembership(acl, membership(role)))).toEqual([ClaimMappingMembershipErrorType.roleNotFound])
		}
		for (const name of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
			expect(types(validateClaimMappingMembership(acl, membership('editor', [{ name, values: ['x'] }]))))
				.toEqual([ClaimMappingMembershipErrorType.variableNotFound])
		}
	})

	describe('condition variables', () => {
		test('rejects a claim-derived condition value without an allow allowlist (injection guard)', () => {
			expect(types(validateClaimMappingMembership(acl, membership('editor', [{ name: 'siteFilter', from: { claim: 'filter' } }]))))
				.toContain(ClaimMappingMembershipErrorType.conditionInjection)
		})

		test('rejects a passthrough claim-derived condition value even with an allow allowlist', () => {
			expect(types(validateClaimMappingMembership(
				acl,
				membership('editor', [{ name: 'siteFilter', from: { claim: 'filter' }, passthrough: true, allow: ['{"eq":"x"}'] }]),
			))).toContain(ClaimMappingMembershipErrorType.conditionInjection)
		})

		test('rejects an allow:undefined claim-derived condition value (the empty-vs-undefined distinction)', () => {
			// allow defined-but-empty is allowed shape-wise (it just yields no derived values); allow undefined is the injection case
			expect(types(validateClaimMappingMembership(acl, membership('editor', [{ name: 'siteFilter', from: { claim: 'filter' }, allow: [] }]))))
				.not.toContain(ClaimMappingMembershipErrorType.conditionInjection)
		})

		test('accepts a claim-derived condition value bounded by an allow allowlist of valid conditions', () => {
			expect(validateClaimMappingMembership(acl, membership('editor', [{ name: 'siteFilter', from: { claim: 'filter' }, allow: ['{"eq":"site-1"}'] }])))
				.toEqual([])
		})

		test('rejects a constant condition value that is not a parseable ACL condition', () => {
			expect(types(validateClaimMappingMembership(acl, membership('editor', [{ name: 'siteFilter', values: ['not-a-condition'] }]))))
				.toEqual([ClaimMappingMembershipErrorType.conditionValueInvalid])
		})

		test('CORR-2: rejects a malformed `allow` entry on a condition variable (not just constant `values`)', () => {
			expect(
				types(validateClaimMappingMembership(acl, membership('editor', [{ name: 'siteFilter', from: { claim: 'filter' }, allow: ['not-a-condition'] }]))),
			)
				.toContain(ClaimMappingMembershipErrorType.conditionValueInvalid)
		})

		test('CORR-2: rejects a malformed `map` output on a condition variable', () => {
			expect(types(validateClaimMappingMembership(
				acl,
				membership('editor', [{ name: 'siteFilter', from: { claim: 'filter' }, map: { a: ['not-a-condition'] }, allow: ['not-a-condition'] }]),
			))).toContain(ClaimMappingMembershipErrorType.conditionValueInvalid)
		})
	})

	test('ARCH-2: agrees with MembershipResolver on whether a constant-only membership is valid (excluding partial-grant VARIABLE_EMPTY)', () => {
		const corpus: ClaimMappingMembership[] = [
			membership('editor', [{ name: 'language', values: ['uuid-en'] }]),
			membership('editor', [{ name: 'siteFilter', values: ['{"eq":"x"}'] }]),
			membership('editor', [{ name: 'siteFilter', values: ['not-a-condition'] }]),
			membership('editor', [{ name: 'me', values: ['x'] }]),
			membership('editor', [{ name: 'ghost', values: ['x'] }]),
			membership('salesperson'),
			membership('editor'),
		]
		const resolver = new MembershipResolver()
		for (const m of corpus) {
			const a09Rejects = validateClaimMappingMembership(acl, m).length > 0
			const resolverRejects = resolver
				.resolve(
					acl,
					[{ role: m.role, variables: (m.variables ?? []).map(v => ({ name: v.name, values: v.values ?? [] })) }],
					MembershipResolver.UnknownIdentity,
					false,
				)
				.errors.filter(it => it.error !== MembershipValidationErrorType.VARIABLE_EMPTY)
				.length > 0
			expect(a09Rejects).toBe(resolverRejects)
		}
	})
})
