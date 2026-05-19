import { describe, expect, test } from 'bun:test'
import { PolicySource, Statement } from '@contember/policy'
import { Authorizator } from '@contember/authorization'
import { PermissionContext } from '../../../src/model/authorization/PermissionContext'
import { Identity } from '../../../src/model/authorization/Identity'

/**
 * `buildContext` must not let the caller shadow server-supplied identity —
 * resolvers that pass `{ subject, ...spreadFromInput }` would otherwise be
 * able to (accidentally or otherwise) substitute another principal.
 */
describe('PermissionContext.buildContext', () => {
	const makeContext = (capturedContext: { value: any }, identityArgs: { id: string; roles: readonly string[] }) => {
		const identity: any = {
			id: identityArgs.id,
			roles: identityArgs.roles,
			async getProjectMemberships() {
				return []
			},
		} as Identity

		const captureSource: PolicySource = {
			name: 'capture',
			getStatements(context) {
				capturedContext.value = context
				return [] as Statement[]
			},
		}

		return new PermissionContext(
			identity,
			{} as Authorizator,
			{} as any,
			{} as any,
			[captureSource],
		)
	}

	test('caller cannot overwrite identity via context spread', async () => {
		const captured = { value: null as any }
		const ctx = makeContext(captured, { id: 'real-id', roles: ['login'] })

		await ctx.isAllowedAction('tenant:project.view', 'project:any', {
			identity: { id: 'spoofed', roles: ['super_admin'] } as any,
		})

		expect(captured.value.identity).toEqual({ id: 'real-id', roles: ['login'] })
	})

	test('caller-supplied non-identity fields are preserved', async () => {
		const captured = { value: null as any }
		const ctx = makeContext(captured, { id: 'real-id', roles: ['login'] })

		await ctx.isAllowedAction('x', 'y', {
			subject: { roles: ['admin'] },
			something: 'else',
		})

		expect(captured.value.subject).toEqual({ roles: ['admin'] })
		expect(captured.value.something).toBe('else')
	})

	test('identity is always present even without caller context', async () => {
		const captured = { value: null as any }
		const ctx = makeContext(captured, { id: 'real-id', roles: ['login', 'person'] })

		await ctx.isAllowedAction('x', 'y')

		expect(captured.value.identity).toEqual({ id: 'real-id', roles: ['login', 'person'] })
	})
})

/**
 * Engine treats deny conditions fail-closed when a referenced context path is
 * missing — built-in role-escalation guards stay effective even if a resolver
 * forgets to populate `subject.*`. The opposite (allow with missing context)
 * is still fail-closed: the statement does not apply, default deny stands.
 */
describe('PermissionContext.isAllowedAction — missing-context deny is fail-closed', () => {
	const buildCtx = (sources: PolicySource[]) => {
		const identity: any = {
			id: 'id',
			roles: ['login'],
			async getProjectMemberships() {
				return []
			},
		} as Identity
		return new PermissionContext(
			identity,
			{} as Authorizator,
			{} as any,
			{} as any,
			sources,
		)
	}

	test('deny fires when condition path is missing (guard cannot be bypassed)', async () => {
		const allowAndConditionalDeny: PolicySource = {
			name: 'mixed',
			getStatements() {
				return [
					{ effect: 'allow' as const, actions: ['x'], resources: ['*'] },
					{
						effect: 'deny' as const,
						actions: ['x'],
						resources: ['*'],
						conditions: {
							'forAnyValue:stringEquals': { 'subject.roles': ['danger'] },
						},
					},
				]
			},
		}
		const ctx = buildCtx([allowAndConditionalDeny])

		// subject.roles is missing — deny still fires (fail-closed).
		expect(await ctx.isAllowedAction('x', '*')).toBe(false)
		// Present but doesn't trigger the deny — allow wins.
		expect(await ctx.isAllowedAction('x', '*', { subject: { roles: ['safe'] } })).toBe(true)
		// Present and triggers the deny.
		expect(await ctx.isAllowedAction('x', '*', { subject: { roles: ['danger'] } })).toBe(false)
	})

	test('allow with missing condition path falls through to default deny', async () => {
		const conditionalAllow: PolicySource = {
			name: 'allow',
			getStatements() {
				return [{
					effect: 'allow' as const,
					actions: ['x'],
					resources: ['*'],
					conditions: { stringEquals: { 'subject.role': 'admin' } },
				}]
			},
		}
		const ctx = buildCtx([conditionalAllow])

		// subject.role missing — allow doesn't apply → default deny.
		expect(await ctx.isAllowedAction('x', '*')).toBe(false)
		// Present and matches — allow.
		expect(await ctx.isAllowedAction('x', '*', { subject: { role: 'admin' } })).toBe(true)
	})
})
