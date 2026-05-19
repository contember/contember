import { describe, expect, test } from 'bun:test'
import { PolicyNotFoundError, PolicyService, PolicyValidationError } from '../../../src/model/policy'
import type { DatabaseContext } from '../../../src/model/utils'
import type { PolicyDto } from '../../../src/model/policy'

const makeDb = (overrides: {
	fetch?: (query: any) => any
	execute?: (command: any) => any
}): DatabaseContext => {
	const calls: any[] = []
	const db = {
		queryHandler: {
			fetch: overrides.fetch ?? (() => undefined),
		},
		commandBus: {
			execute: overrides.execute ?? (() => {
				throw new Error('commandBus.execute should not be called in this test')
			}),
		},
		_calls: calls,
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
			service.create(db, { slug: 'builtin:foo', document: { statements: [] } }),
		).rejects.toBeInstanceOf(PolicyValidationError)
	})
})

describe('PolicyService.update', () => {
	test('throws PolicyNotFoundError when slug does not exist', async () => {
		const db = makeDb({ fetch: () => null })
		const service = new PolicyService()
		await expect(
			service.update(db, 'missing', { label: 'x' }),
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
		const result = await service.update(db, 'auditor', { label: 'new label' })
		expect(executed).toBe(true)
		expect(result).toEqual({ updated: true })
	})

	test('validates document before executing update', async () => {
		const db = makeDb({ fetch: () => customPolicy })
		const service = new PolicyService()
		await expect(
			service.update(db, 'auditor', { document: { statements: 'oops' as any } }),
		).rejects.toBeInstanceOf(PolicyValidationError)
	})
})

describe('PolicyService.delete', () => {
	test('forwards to the command and returns its result', async () => {
		let executed = false
		const db = makeDb({
			execute: () => {
				executed = true
				return { deleted: true }
			},
		})
		const service = new PolicyService()
		expect(await service.delete(db, 'auditor')).toEqual({ deleted: true })
		expect(executed).toBe(true)
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
			service.assign(db, 'identity-x', 'auditor', { team: '${identity.id}' }),
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
		await service.assign(db, 'identity-x', 'auditor', { team: 'eng', level: 3 })
		expect(executed).toBe(true)
	})
})
