import { describe, expect, test } from 'bun:test'
import { PolicyNotFoundError, PolicyService, PolicyValidationError } from '../../../src/model/policy'
import { IdentityPolicyAssignmentsQuery } from '../../../src/model/policy/queries/IdentityPolicyAssignmentsQuery'
import type { DatabaseContext } from '../../../src/model/utils'
import type { PolicyActor, PolicyDto } from '../../../src/model/policy'

const actor: PolicyActor = { id: 'actor-id', roles: [] }

const makeDb = (overrides: {
	fetch?: (query: any) => any
	execute?: (command: any) => any
}): DatabaseContext => {
	const db = {
		queryHandler: {
			// The grant-boundary surface load runs `IdentityPolicyAssignmentsQuery`;
			// the actor here holds no policies, so return an empty assignment list.
			fetch: (query: any) => query instanceof IdentityPolicyAssignmentsQuery ? [] : (overrides.fetch ?? (() => undefined))(query),
		},
		commandBus: {
			execute: overrides.execute ?? (() => {
				throw new Error('commandBus.execute should not be called in this test')
			}),
		},
	}
	return db as any
}

const customPolicy: PolicyDto = {
	id: 'custom-id',
	slug: 'auditor',
	label: 'Auditor',
	description: null,
	document: { version: '1', statements: [] },
	version: 1,
	createdAt: new Date(),
	updatedAt: new Date(),
}

describe('PolicyService.create — slug protection', () => {
	test('rejects builtin: prefix', async () => {
		const db = makeDb({})
		const service = new PolicyService()
		await expect(
			service.create(db, actor, { slug: 'builtin:foo', document: { statements: [] } }),
		).rejects.toBeInstanceOf(PolicyValidationError)
	})
})

describe('PolicyService.update', () => {
	test('throws PolicyNotFoundError when slug does not exist', async () => {
		const db = makeDb({ fetch: () => null })
		const service = new PolicyService()
		await expect(
			service.update(db, actor, 'missing', { label: 'x' }),
		).rejects.toBeInstanceOf(PolicyNotFoundError)
	})

	test('updates an existing policy', async () => {
		let executed = false
		const db = makeDb({
			fetch: () => customPolicy,
			execute: () => {
				executed = true
				return { updated: true }
			},
		})
		const service = new PolicyService()
		const result = await service.update(db, actor, 'auditor', { label: 'new label' })
		expect(executed).toBe(true)
		expect(result).toEqual({ updated: true })
	})

	test('validates document before executing update', async () => {
		const db = makeDb({ fetch: () => customPolicy })
		const service = new PolicyService()
		await expect(
			service.update(db, actor, 'auditor', { document: { statements: 'oops' as any } }),
		).rejects.toBeInstanceOf(PolicyValidationError)
	})
})

describe('PolicyService.delete', () => {
	test('forwards to the command and returns its result', async () => {
		let executed = false
		const db = makeDb({
			fetch: () => customPolicy,
			execute: () => {
				executed = true
				return { deleted: true }
			},
		})
		const service = new PolicyService()
		expect(await service.delete(db, actor, 'auditor')).toEqual({ deleted: true })
		expect(executed).toBe(true)
	})

	test('returns deleted:false when the policy does not exist', async () => {
		const db = makeDb({ fetch: () => null })
		const service = new PolicyService()
		expect(await service.delete(db, actor, 'missing')).toEqual({ deleted: false })
	})
})

describe('PolicyService.assign — tag validation', () => {
	test('rejects template syntax in tags before touching the DB', async () => {
		let dbTouched = false
		const db = makeDb({
			fetch: () => {
				dbTouched = true
				return customPolicy
			},
		})
		const service = new PolicyService()
		await expect(
			service.assign(db, actor, 'identity-x', 'auditor', { team: '${identity.id}' }),
		).rejects.toBeInstanceOf(PolicyValidationError)
		expect(dbTouched).toBe(false)
	})

	test('passes clean tags through', async () => {
		let executed = false
		const db = makeDb({
			fetch: () => customPolicy,
			execute: () => {
				executed = true
			},
		})
		const service = new PolicyService()
		await service.assign(db, actor, 'identity-x', 'auditor', { team: 'eng', level: 3 })
		expect(executed).toBe(true)
	})
})
