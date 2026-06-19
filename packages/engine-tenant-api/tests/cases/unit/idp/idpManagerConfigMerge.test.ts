import { describe, expect, test } from 'bun:test'
import { IDPHandlerRegistry, IDPManager } from '../../../../src/model/service/idp/index.js'
import { UpdateIdpCommand } from '../../../../src/model/commands/idp/UpdateIdpCommand.js'
import { DatabaseContext } from '../../../../src/index.js'
import { IdPMock } from '../../../src/IdPMock.js'

// updateIDP with `mergeConfiguration: true` merges configurer-supplied keys into the stored config. A
// crafted `__proto__` / `constructor` / `prototype` key is a prototype-pollution sink, so the merge skips
// those keys outright. This pins that guard (the only updateIDP test otherwise just asserts a rejection).

const makeManager = () => {
	const registry = new IDPHandlerRegistry()
	registry.registerHandler('mock', new IdPMock())
	return new IDPManager(registry, { getSchema: () => Promise.resolve(undefined) })
}

const makeDb = (existingConfiguration: Record<string, unknown>) => {
	const executed: unknown[] = []
	const inner: any = {
		queryHandler: {
			fetch: async () => ({ id: 'idp-1', slug: 'mock', type: 'mock', configuration: existingConfiguration, disabledAt: null }),
		},
		commandBus: { execute: async (command: unknown) => void executed.push(command) },
	}
	inner.transaction = async (cb: (db: any) => Promise<unknown>) => cb(inner)
	return { db: inner as unknown as DatabaseContext, executed }
}

describe('IDPManager.updateIDP — config-merge prototype-pollution guard', () => {
	test('skips own __proto__ / constructor / prototype keys when merging (no reparenting, not stored)', async () => {
		const { db, executed } = makeDb({ externalIdentifier: 'sub' })
		// Built via JSON.parse so the dunder names are OWN ENUMERABLE keys — an object literal `{ __proto__: … }`
		// would set the literal's prototype instead. This mirrors how a hostile JSON config arrives over the wire.
		const malicious = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"x":1},"prototype":{"y":1},"email":"e@x.io"}')
		const response = await makeManager().updateIDP(db, 'mock', { configuration: malicious }, true)
		expect(response.ok).toBe(true)

		const update = executed.find((c): c is UpdateIdpCommand => c instanceof UpdateIdpCommand)
		expect(update).toBeDefined()
		const storedConfiguration = (update as unknown as { data: { configuration: Record<string, unknown> } }).data.configuration
		// the `__proto__` key was skipped, so the merged object's prototype is still Object.prototype (not reparented)
		expect(Object.getPrototypeOf(storedConfiguration)).toBe(Object.prototype)
		// only the legit merged key + the pre-existing one survive; all three dunder keys were dropped
		expect(storedConfiguration).toEqual({ externalIdentifier: 'sub', email: 'e@x.io' })
		expect(Object.prototype.hasOwnProperty.call(storedConfiguration, 'constructor')).toBe(false)
		expect(Object.prototype.hasOwnProperty.call(storedConfiguration, 'prototype')).toBe(false)
	})

	test('a normal merge still overwrites keys and a null deletes them', async () => {
		const { db, executed } = makeDb({ externalIdentifier: 'sub', email: 'old@x.io', name: 'drop-me' })
		const response = await makeManager().updateIDP(db, 'mock', { configuration: { email: 'new@x.io', name: null } }, true)
		expect(response.ok).toBe(true)
		const update = executed.find((c): c is UpdateIdpCommand => c instanceof UpdateIdpCommand)
		const storedConfiguration = (update as unknown as { data: { configuration: Record<string, unknown> } }).data.configuration
		expect(storedConfiguration).toEqual({ externalIdentifier: 'sub', email: 'new@x.io' })
	})

	test('merges a nested config object instead of replacing it, so updating claimMapping.rules keeps the OIDC identity-remap', async () => {
		// `configuration.claimMapping` holds two independent concerns in one object: the OIDC identity-remap
		// (externalIdentifier/email/name/attributesKey) AND the A09 `rules`. A shallow replace of the whole
		// `claimMapping` key while updating only `rules` would silently wipe the remap (and vice versa).
		const { db, executed } = makeDb({
			clientId: 'cid',
			claimMapping: { externalIdentifier: 'oid', email: 'mail', rules: [{ claim: 'old', grantMembership: { project: 'p', role: 'r' } }] },
		})
		const response = await makeManager().updateIDP(db, 'mock', {
			configuration: { claimMapping: { rules: [{ claim: 'groups', contains: 'admins', grantMembership: { project: 'p', role: 'admin' } }] } },
		}, true)
		expect(response.ok).toBe(true)
		const update = executed.find((c): c is UpdateIdpCommand => c instanceof UpdateIdpCommand)
		const storedConfiguration = (update as unknown as { data: { configuration: Record<string, unknown> } }).data.configuration
		expect(storedConfiguration).toEqual({
			clientId: 'cid',
			claimMapping: {
				// remap siblings preserved
				externalIdentifier: 'oid',
				email: 'mail',
				// array value replaced wholesale (not merged element-wise)
				rules: [{ claim: 'groups', contains: 'admins', grantMembership: { project: 'p', role: 'admin' } }],
			},
		})
	})

	test('a nested null deletes only that nested key, and nested dunder keys are skipped at every level', async () => {
		const { db, executed } = makeDb({ claimMapping: { externalIdentifier: 'oid', attributesKey: 'attrs' } })
		// nested dunder arrives as an OWN key (built via JSON.parse, like a hostile JSON config over the wire)
		const updates = JSON.parse('{"claimMapping":{"attributesKey":null,"name":"display","__proto__":{"polluted":true}}}')
		const response = await makeManager().updateIDP(db, 'mock', { configuration: updates }, true)
		expect(response.ok).toBe(true)
		const update = executed.find((c): c is UpdateIdpCommand => c instanceof UpdateIdpCommand)
		const storedConfiguration = (update as unknown as { data: { configuration: Record<string, unknown> } }).data.configuration
		expect(storedConfiguration).toEqual({ claimMapping: { externalIdentifier: 'oid', name: 'display' } })
		// the nested __proto__ key did not reparent the merged child object
		expect(Object.getPrototypeOf(storedConfiguration.claimMapping)).toBe(Object.prototype)
		expect(Object.prototype.hasOwnProperty.call(storedConfiguration.claimMapping, '__proto__')).toBe(false)
	})
})
