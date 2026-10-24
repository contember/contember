import { describe, expect, test } from 'bun:test'
import { WorkloadIdentity } from '../../../../../src/model/type/index.js'
import { principalSelectionKey, validateTrustDefinition } from '../../../../../src/model/service/workloadIdentity/apply/trustDefinition.js'

const instanceConfig: WorkloadIdentity.InstanceConfig = { ...WorkloadIdentity.defaultInstanceConfig, insecureIssuers: ['localhost'] }

const oidcDefinition = (overrides: Partial<WorkloadIdentity.TrustDefinition> = {}): WorkloadIdentity.TrustDefinition => ({
	profile: 'oidc',
	issuer: 'https://auth.example.com',
	audience: 'contember:test:web',
	conditions: [{ claim: 'sub', equals: 'web-backend' }],
	roles: [],
	memberships: [],
	disabled: false,
	...overrides,
})

const githubDefinition = (overrides: Partial<WorkloadIdentity.TrustDefinition> = {}): WorkloadIdentity.TrustDefinition => ({
	profile: 'github-actions',
	issuer: 'https://token.actions.githubusercontent.com',
	audience: 'contember:test:deploy',
	conditions: [{ claim: 'repository_id', equals: '123' }],
	roles: [],
	memberships: [],
	disabled: false,
	...overrides,
})

const errorOf = (definition: WorkloadIdentity.TrustDefinition) => {
	const result = validateTrustDefinition(definition, instanceConfig)
	if (result.ok) {
		throw new Error('expected a validation error')
	}
	return { code: result.error, message: result.errorMessage, details: result.metadata?.details }
}

describe('validateTrustDefinition', () => {
	test('fills profile defaults', () => {
		const result = validateTrustDefinition(oidcDefinition({ description: '' }), instanceConfig)
		expect(result).toEqual({
			ok: true,
			result: {
				profile: 'oidc',
				issuer: 'https://auth.example.com',
				audience: 'contember:test:web',
				jwksUri: null,
				signingAlgs: ['ES256', 'RS256'],
				acceptedTyp: ['JWT', null],
				acceptAudienceArray: false,
				requireDpop: false,
				conditions: [{ claim: 'sub', equals: 'web-backend' }],
				maxTokenLifetime: 3600,
				trustForwardedInfo: false,
				disabled: false,
				description: null,
				roles: [],
				memberships: [],
			},
		})
	})

	test('oidc requires an exact sub condition', () => {
		const error = errorOf(oidcDefinition({ conditions: [{ claim: 'sub', startsWith: 'web' }] }))
		expect(error.code).toBe('INVALID_CONDITIONS')
		expect(error.details).toEqual([{ index: null, message: 'the oidc profile requires a condition on `sub` with `equals` or `in`' }])
	})

	test('a condition operand that cannot match the declared claim type is rejected', () => {
		const error = errorOf(githubDefinition({ conditions: [{ claim: 'repository_id', equals: 123 }] }))
		expect(error.code).toBe('INVALID_CONDITIONS')
		expect(error.details).toEqual([{ index: 0, message: 'claim is declared as a string, an operand of type number can never match it' }])
	})

	test('oidc refuses an issuer with a dedicated profile', () => {
		expect(errorOf(oidcDefinition({ issuer: 'https://token.actions.githubusercontent.com' })).code).toBe('ISSUER_NOT_ALLOWED')
		expect(errorOf(oidcDefinition({ issuer: 'https://token.actions.githubusercontent.com/' })).message).toContain('github-actions profile')
	})

	test('http issuer and jwks uri are refused unless the host is an insecure issuer of the instance', () => {
		expect(errorOf(oidcDefinition({ issuer: 'http://auth.example.com' })).code).toBe('ISSUER_NOT_ALLOWED')
		expect(errorOf(oidcDefinition({ jwksUri: 'http://keys.example.com/jwks.json' })).code).toBe('ISSUER_NOT_ALLOWED')
		expect(validateTrustDefinition(oidcDefinition({ issuer: 'http://localhost:3000', jwksUri: 'http://localhost:3000/jwks' }), instanceConfig).ok).toBe(
			true,
		)
		expect(validateTrustDefinition(oidcDefinition({ issuer: 'http://localhost:3000' }), WorkloadIdentity.defaultInstanceConfig).ok).toBe(false)
		expect(errorOf(oidcDefinition({ issuer: 'not a url' })).code).toBe('INVALID_DEFINITION')
	})

	test('github-actions fixes algorithms and typ and refuses dpop / audience arrays', () => {
		expect(validateTrustDefinition(githubDefinition({ signingAlgs: ['RS256'], acceptedTyp: ['JWT'] }), instanceConfig).ok).toBe(true)
		expect(errorOf(githubDefinition({ signingAlgs: ['ES256'] })).code).toBe('INVALID_DEFINITION')
		expect(errorOf(githubDefinition({ acceptedTyp: ['JWT', null] })).code).toBe('INVALID_DEFINITION')
		expect(errorOf(githubDefinition({ requireDpop: true })).code).toBe('INVALID_DEFINITION')
		expect(errorOf(githubDefinition({ acceptAudienceArray: true })).code).toBe('INVALID_DEFINITION')
	})

	test('oidc allows asymmetric algorithms only', () => {
		expect(errorOf(oidcDefinition({ signingAlgs: ['HS256'] })).code).toBe('INVALID_DEFINITION')
		expect(errorOf(oidcDefinition({ signingAlgs: [] })).code).toBe('INVALID_DEFINITION')
		expect(errorOf(oidcDefinition({ acceptedTyp: [] })).code).toBe('INVALID_DEFINITION')
	})

	test('lifetime must be positive and within the profile cap; audience must not be empty', () => {
		expect(errorOf(oidcDefinition({ maxTokenLifetime: 0 })).code).toBe('INVALID_DEFINITION')
		expect(errorOf(oidcDefinition({ maxTokenLifetime: 86_401 })).code).toBe('INVALID_DEFINITION')
		expect(validateTrustDefinition(oidcDefinition({ maxTokenLifetime: 86_400 }), instanceConfig).ok).toBe(true)
		expect(errorOf(oidcDefinition({ audience: ' ' })).code).toBe('INVALID_DEFINITION')
	})

	test('login is refused on a trust', () => {
		expect(errorOf(oidcDefinition({ roles: ['login'] })).code).toBe('ROLE_NOT_ALLOWED')
	})

	test('an implicit admin role together with memberships is rejected', () => {
		const memberships = [{ project: 'blog', role: 'editor', variables: [] }]
		expect(errorOf(oidcDefinition({ roles: ['project_admin'], memberships })).code).toBe('IMPLICIT_MEMBERSHIP_CONFLICT')
		expect(errorOf(oidcDefinition({ roles: ['super_admin'], memberships })).code).toBe('IMPLICIT_MEMBERSHIP_CONFLICT')
		expect(validateTrustDefinition(oidcDefinition({ roles: ['project_admin'] }), instanceConfig).ok).toBe(true)
	})

	test('duplicate memberships and empty variables are rejected', () => {
		const membership = { project: 'blog', role: 'editor', variables: [{ name: 'language', values: ['cs'] }] }
		expect(errorOf(oidcDefinition({ memberships: [membership, membership] })).code).toBe('INVALID_MEMBERSHIP')
		expect(errorOf(oidcDefinition({ memberships: [{ ...membership, variables: [{ name: 'language', values: [] }] }] })).code).toBe(
			'INVALID_MEMBERSHIP',
		)
	})
})

describe('principalSelectionKey', () => {
	const canonical = (definition: WorkloadIdentity.TrustDefinition) => {
		const result = validateTrustDefinition(definition, instanceConfig)
		if (!result.ok) {
			throw new Error(result.errorMessage)
		}
		return principalSelectionKey(result.result)
	}

	test('is insensitive to ordering and duplicates', () => {
		const a = canonical(oidcDefinition({
			conditions: [{ claim: 'sub', in: ['b', 'a'] }, { claim: 'env', equals: 'prod' }],
			signingAlgs: ['RS256', 'ES256'],
			acceptedTyp: [null, 'JWT'],
		}))
		const b = canonical(oidcDefinition({
			conditions: [{ claim: 'env', equals: 'prod' }, { claim: 'sub', in: ['a', 'b', 'a'] }],
		}))
		expect(a).toBe(b)
	})

	test('ignores grants, lifetime and description', () => {
		const a = canonical(oidcDefinition())
		const b = canonical(oidcDefinition({
			roles: ['entrypoint_deployer'],
			maxTokenLifetime: 60,
			description: 'changed',
			requireDpop: true,
			memberships: [{ project: 'blog', role: 'editor', variables: [] }],
		}))
		expect(a).toBe(b)
	})

	test('changes with the conditions, the audience or the key source', () => {
		const base = canonical(oidcDefinition())
		expect(canonical(oidcDefinition({ conditions: [{ claim: 'sub', equals: 'other' }] }))).not.toBe(base)
		expect(canonical(oidcDefinition({ audience: 'other' }))).not.toBe(base)
		expect(canonical(oidcDefinition({ jwksUri: 'https://auth.example.com/jwks' }))).not.toBe(base)
		expect(canonical(oidcDefinition({ acceptedTyp: ['JWT'] }))).not.toBe(base)
		expect(canonical(oidcDefinition({ conditions: [{ path: ['sub'], equals: 'web-backend' }, { claim: 'sub', equals: 'web-backend' }] }))).not.toBe(
			base,
		)
	})
})
