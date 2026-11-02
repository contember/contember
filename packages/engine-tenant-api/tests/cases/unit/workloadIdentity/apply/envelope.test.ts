import { describe, expect, test } from 'bun:test'
import { Acl } from '@contember/schema'
import { closureTargetToMembership, expandEnvelope } from '../../../../../src/model/service/workloadIdentity/apply/envelope.js'
import { parseAssumeRule } from '../../../../../src/model/service/workloadIdentity/apply/assumeRule.js'

const acl: Acl.Schema = {
	roles: {
		sync: {
			entities: {},
			variables: {
				site: { type: Acl.VariableType.entity, entityName: 'Site' },
			},
		},
		editor: {
			entities: {},
			system: { assumeIdentity: true, history: 'any' },
			variables: {
				site: { type: Acl.VariableType.entity, entityName: 'Site' },
				filter: { type: Acl.VariableType.condition },
				self: { type: Acl.VariableType.predefined, value: 'identityID' },
			},
		},
		reader: {
			entities: {},
			debug: true,
			variables: {},
		},
	},
}

const membership: Acl.Membership = { role: 'sync', variables: [{ name: 'site', values: ['shop', 'blog', 'shop'] }] }

describe('expandEnvelope', () => {
	test('expands a variable reference to the source membership values', () => {
		expect(expandEnvelope(acl, membership, { sync: { variables: { site: 'site' } }, reader: {} })).toEqual({
			ok: true,
			targets: [
				{ role: 'sync', variables: { site: ['blog', 'shop'] }, unbounded: false, sensitiveFlags: [] },
				{ role: 'reader', variables: {}, unbounded: false, sensitiveFlags: ['debug'] },
			],
		})
	})

	test('a rule must name every non-predefined variable of the target role', () => {
		expect(expandEnvelope(acl, membership, { editor: { variables: { site: 'site' } } })).toEqual({
			ok: false,
			errors: [{ role: 'editor', variable: 'filter', message: 'the rule must name every variable of the role' }],
		})
	})

	test('a rule naming a predefined variable is rejected', () => {
		const result = expandEnvelope(acl, membership, { editor: { variables: { site: 'site', filter: true, self: true } } })
		expect(result.ok).toBe(false)
		expect(!result.ok && result.errors.map(it => [it.role, it.variable])).toEqual([['editor', 'self']])
	})

	test('a role missing from the schema is rejected', () => {
		expect(expandEnvelope(acl, membership, { admin: true })).toEqual({
			ok: false,
			errors: [{ role: 'admin', message: 'role is not defined in the project schema' }],
		})
		expect(expandEnvelope(acl, membership, parseRule(JSON.parse('{"__proto__": true}'))).ok).toBe(false)
	})

	test('a reference to a variable the source membership lacks is rejected', () => {
		const result = expandEnvelope(acl, membership, { sync: { variables: { site: 'region' } } })
		expect(result.ok).toBe(false)
		expect(!result.ok && result.errors[0].variable).toBe('site')
	})

	test('a variable unknown to the role is rejected', () => {
		const result = expandEnvelope(acl, membership, { sync: { variables: { site: 'site', other: true } } })
		expect(!result.ok && result.errors.map(it => it.variable)).toEqual(['other'])
	})

	test('true rules and true variables are unbounded and carry the sensitive flags', () => {
		expect(expandEnvelope(acl, membership, { editor: true, sync: { variables: { site: true } } })).toEqual({
			ok: true,
			targets: [
				{ role: 'editor', variables: { site: '*', filter: '*' }, unbounded: true, sensitiveFlags: ['assumeIdentity', 'history'] },
				{ role: 'sync', variables: { site: '*' }, unbounded: true, sensitiveFlags: [] },
			],
		})
		expect(expandEnvelope(acl, membership, { editor: { variables: true } })).toMatchObject({ ok: true, targets: [{ unbounded: true }] })
	})

	test('a top-level true rule cannot be represented finitely', () => {
		expect(expandEnvelope(acl, membership, true).ok).toBe(false)
		expect(expandEnvelope(acl, membership, false)).toEqual({ ok: true, targets: [] })
	})

	test('a bounded target is authorized as the direct grant it stands for', () => {
		expect(closureTargetToMembership({ role: 'sync', variables: { site: ['blog'] }, unbounded: false, sensitiveFlags: [] })).toEqual({
			role: 'sync',
			variables: [{ name: 'site', values: ['blog'] }],
		})
	})
})

const parseRule = (input: unknown): Acl.MembershipMatchRule => {
	const result = parseAssumeRule(input)
	if (!result.ok) {
		throw new Error(result.message)
	}
	return result.rule
}

describe('parseAssumeRule', () => {
	test('accepts the MembershipMatchRule shape', () => {
		expect(parseAssumeRule({ sync: { variables: { site: 'site' } }, editor: true })).toEqual({
			ok: true,
			rule: { sync: { variables: { site: 'site' } }, editor: true },
		})
		expect(parseAssumeRule(false)).toEqual({ ok: true, rule: false })
	})

	test('rejects anything else', () => {
		expect(parseAssumeRule({ sync: { variables: { site: 1 } } }).ok).toBe(false)
		expect(parseAssumeRule({ sync: { vars: {} } }).ok).toBe(false)
		expect(parseAssumeRule('sync').ok).toBe(false)
	})
})
