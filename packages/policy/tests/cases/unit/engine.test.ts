import { describe, expect, test } from 'bun:test'
import { PolicyEngine, Statement, StaticPolicySource } from '../../../src/index.js'

const engine = (statements: Statement[]) => new PolicyEngine([new StaticPolicySource('test', statements)])

describe('default deny', () => {
	test('no statements → deny', async () => {
		const result = await engine([]).evaluate('any:action', 'any:resource', {})
		expect(result.decision).toBe('deny')
		expect(result.matches).toHaveLength(0)
	})

	test('non-matching action → deny', async () => {
		const result = await engine([
			{ effect: 'allow', actions: ['tenant:project.create'], resources: ['*'] },
		]).evaluate('tenant:project.delete', 'project:x', {})
		expect(result.decision).toBe('deny')
	})
})

describe('allow', () => {
	test('matching action+resource → allow', async () => {
		const result = await engine([
			{ effect: 'allow', actions: ['tenant:project.create'], resources: ['*'] },
		]).evaluate('tenant:project.create', 'project:x', {})
		expect(result.decision).toBe('allow')
		expect(result.matches).toHaveLength(1)
		expect(result.matches[0].effect).toBe('allow')
	})

	test('default resource is **', async () => {
		const result = await engine([
			{ effect: 'allow', actions: ['*'] },
		]).evaluate('tenant:project.create', 'project:x', {})
		expect(result.decision).toBe('allow')
	})

	test('wildcard action', async () => {
		const result = await engine([
			{ effect: 'allow', actions: ['tenant:*'], resources: ['*'] },
		]).evaluate('tenant:project.create', 'project:x', {})
		expect(result.decision).toBe('allow')
	})
})

describe('deny precedence', () => {
	test('explicit deny beats allow', async () => {
		const result = await engine([
			{ effect: 'allow', actions: ['*'], resources: ['*'] },
			{ effect: 'deny', actions: ['tenant:apiKey.createGlobal'], resources: ['*'] },
		]).evaluate('tenant:apiKey.createGlobal', '*', {})
		expect(result.decision).toBe('deny')
	})

	test('deny in different source still wins', async () => {
		const e = new PolicyEngine([
			new StaticPolicySource('allow-all', [
				{ effect: 'allow', actions: ['*'], resources: ['*'] },
			]),
			new StaticPolicySource('deny-specific', [
				{ effect: 'deny', actions: ['tenant:idp.*'], resources: ['*'] },
			]),
		])
		expect((await e.evaluate('tenant:idp.delete', '*', {})).decision).toBe('deny')
		expect((await e.evaluate('tenant:project.create', '*', {})).decision).toBe('allow')
	})
})

describe('conditions', () => {
	test('condition passes → allow', async () => {
		const result = await engine([
			{
				effect: 'allow',
				actions: ['tenant:person.forceSignOut'],
				resources: ['person:*'],
				conditions: { stringEquals: { 'subject.team': '${identity.team}' } },
			},
		]).evaluate(
			'tenant:person.forceSignOut',
			'person:abc',
			{ identity: { team: 'eng' }, subject: { team: 'eng' } },
		)
		expect(result.decision).toBe('allow')
	})

	test('condition fails → deny (statement does not match)', async () => {
		const result = await engine([
			{
				effect: 'allow',
				actions: ['tenant:person.forceSignOut'],
				resources: ['person:*'],
				conditions: { stringEquals: { 'subject.team': '${identity.team}' } },
			},
		]).evaluate(
			'tenant:person.forceSignOut',
			'person:abc',
			{ identity: { team: 'eng' }, subject: { team: 'ops' } },
		)
		expect(result.decision).toBe('deny')
	})

	test('condition fails on deny → falls through, allow wins', async () => {
		const result = await engine([
			{ effect: 'allow', actions: ['tenant:person.*'], resources: ['*'] },
			{
				effect: 'deny',
				actions: ['tenant:person.disable'],
				resources: ['*'],
				conditions: { stringEquals: { 'subject.role': 'admin' } },
			},
		]).evaluate(
			'tenant:person.disable',
			'person:abc',
			{ subject: { role: 'editor' } },
		)
		// Deny condition didn't match (subject.role is editor), so deny doesn't apply
		expect(result.decision).toBe('allow')
	})

	test('deny with MISSING context path fires fail-closed', async () => {
		const result = await engine([
			{ effect: 'allow', actions: ['tenant:person.*'], resources: ['*'] },
			{
				effect: 'deny',
				actions: ['tenant:person.disable'],
				resources: ['*'],
				conditions: { stringEquals: { 'subject.role': 'admin' } },
			},
		]).evaluate(
			'tenant:person.disable',
			'person:abc',
			{}, // subject.role is missing — deny must still fire (cannot verify "not admin")
		)
		expect(result.decision).toBe('deny')
	})

	test('allow with missing condition path is skipped (default deny)', async () => {
		const result = await engine([
			{
				effect: 'allow',
				actions: ['tenant:person.disable'],
				resources: ['*'],
				conditions: { stringEquals: { 'subject.role': 'admin' } },
			},
		]).evaluate('tenant:person.disable', 'person:abc', {})
		expect(result.decision).toBe('deny')
	})

	test('deny with missing path on forAnyValue fires (defends role-escalation guards)', async () => {
		// Mirrors the project_admin built-in shape — deny if subject.roles intersects [super_admin].
		// If caller forgot to populate subject.roles, the guard MUST still apply.
		const result = await engine([
			{ effect: 'allow', actions: ['tenant:identity.addGlobalRoles'], resources: ['*'] },
			{
				effect: 'deny',
				actions: ['tenant:identity.addGlobalRoles'],
				resources: ['*'],
				conditions: {
					'forAnyValue:stringEquals': { 'subject.roles': ['super_admin'] },
				},
			},
		]).evaluate('tenant:identity.addGlobalRoles', '*', {})
		expect(result.decision).toBe('deny')
	})
})

describe('unresolved placeholder in condition expected value', () => {
	test('deny with unresolved ${path} fires fail-closed', async () => {
		// `invoker.team` not in context — the placeholder must NOT silently leak through
		// as a literal string comparison.
		const result = await engine([
			{ effect: 'allow', actions: ['x'], resources: ['*'] },
			{
				effect: 'deny',
				actions: ['x'],
				resources: ['*'],
				conditions: { stringEquals: { 'subject.team': '${invoker.team}' } },
			},
		]).evaluate('x', '*', { subject: { team: 'eng' } })
		expect(result.decision).toBe('deny')
	})

	test('allow with unresolved ${path} does not apply', async () => {
		const result = await engine([
			{
				effect: 'allow',
				actions: ['x'],
				resources: ['*'],
				conditions: { stringEquals: { 'subject.team': '${invoker.team}' } },
			},
		]).evaluate('x', '*', { subject: { team: 'eng' } })
		expect(result.decision).toBe('deny')
	})

	test('resolved placeholder runs the operator normally', async () => {
		const result = await engine([
			{
				effect: 'allow',
				actions: ['x'],
				resources: ['*'],
				conditions: { stringEquals: { 'subject.team': '${invoker.team}' } },
			},
		]).evaluate('x', '*', { subject: { team: 'eng' }, invoker: { team: 'eng' } })
		expect(result.decision).toBe('allow')
	})
})

describe('resource substitution', () => {
	test('placeholder in resource pattern', async () => {
		const result = await engine([
			{ effect: 'allow', actions: ['*'], resources: ['project:${identity.project}'] },
		]).evaluate('any', 'project:webmaster', { identity: { project: 'webmaster' } })
		expect(result.decision).toBe('allow')
	})
})

describe('multiple sources order', () => {
	test('aggregates from all sources', async () => {
		const e = new PolicyEngine([
			new StaticPolicySource('s1', [
				{ effect: 'allow', actions: ['a:b'], resources: ['*'] },
			]),
			new StaticPolicySource('s2', [
				{ effect: 'allow', actions: ['c:d'], resources: ['*'] },
			]),
		])
		expect((await e.evaluate('a:b', '*', {})).decision).toBe('allow')
		expect((await e.evaluate('c:d', '*', {})).decision).toBe('allow')
		expect((await e.evaluate('e:f', '*', {})).decision).toBe('deny')
	})

	test('match trace records source', async () => {
		const e = new PolicyEngine([
			new StaticPolicySource('foo', [
				{ effect: 'allow', actions: ['*'], resources: ['*'] },
			]),
		])
		const result = await e.evaluate('any', 'any', {})
		expect(result.matches[0].source).toBe('foo')
		expect(result.matches[0].statementIndex).toBe(0)
	})
})

describe('async sources', () => {
	test('awaits async getStatements', async () => {
		const e = new PolicyEngine([
			{
				name: 'async',
				getStatements: async () => {
					await new Promise(r => setTimeout(r, 1))
					return [{ effect: 'allow' as const, actions: ['x'], resources: ['*'] }]
				},
			},
		])
		expect((await e.evaluate('x', 'y', {})).decision).toBe('allow')
	})
})

describe('unresolved placeholder in action/resource pattern', () => {
	test('deny with unresolved ${...} in action pattern still fires (fail-closed)', async () => {
		// Without the fail-closed handling for patterns, `tenant:${user.scope}.disable`
		// stays literal after substitution and the glob would silently miss.
		const result = await engine([
			{ effect: 'allow', actions: ['tenant:person.disable'], resources: ['*'] },
			{
				effect: 'deny',
				actions: ['tenant:${user.scope}.disable'],
				resources: ['*'],
			},
		]).evaluate('tenant:person.disable', '*', {/* user.scope absent */})
		expect(result.decision).toBe('deny')
	})

	test('deny with unresolved ${...} in resource pattern still fires', async () => {
		const result = await engine([
			{ effect: 'allow', actions: ['*'], resources: ['*'] },
			{
				effect: 'deny',
				actions: ['*'],
				resources: ['project:${identity.protected}'],
			},
		]).evaluate('any', 'project:webmaster', {/* identity.protected absent */})
		expect(result.decision).toBe('deny')
	})

	test('allow with unresolved ${...} in action pattern does NOT apply', async () => {
		// fail-closed allow: only the cleaned (fully-resolved) patterns count;
		// if none remain, the statement skips.
		const result = await engine([
			{
				effect: 'allow',
				actions: ['tenant:${user.scope}.disable'],
				resources: ['*'],
			},
		]).evaluate('tenant:person.disable', '*', {})
		expect(result.decision).toBe('deny')
	})

	test('allow with mixed patterns — resolved ones still apply', async () => {
		// One pattern resolves, the other has an unresolved placeholder. The
		// resolved one should still match.
		const result = await engine([
			{
				effect: 'allow',
				actions: ['tenant:${user.scope}.disable', 'tenant:person.disable'],
				resources: ['*'],
			},
		]).evaluate('tenant:person.disable', '*', {})
		expect(result.decision).toBe('allow')
	})

	test('resolved placeholder in pattern matches normally', async () => {
		const result = await engine([
			{
				effect: 'allow',
				actions: ['tenant:${scope}.disable'],
				resources: ['*'],
			},
		]).evaluate('tenant:person.disable', '*', { scope: 'person' })
		expect(result.decision).toBe('allow')
	})
})
