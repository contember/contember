import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { SchemaStateManager } from '../../../src/index.js'
import { emptySchema } from '@contember/schema-utils'
import { Schema } from '@contember/schema'

const schemaWithAcl: Schema = {
	...emptySchema,
	acl: {
		roles: {
			admin: { variables: {}, stages: '*', entities: {} },
		},
	},
	settings: { content: { useExistsInHasManyFilter: true } },
}

describe('SchemaStateManager', () => {
	let baseDir: string
	let stateDir: string
	let manager: SchemaStateManager

	beforeEach(async () => {
		baseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contember-state-'))
		stateDir = path.join(baseDir, 'state')
		manager = new SchemaStateManager(stateDir)
	})

	afterEach(async () => {
		await fs.rm(baseDir, { recursive: true, force: true })
	})

	test('isStateMode is false when the state directory does not exist', async () => {
		expect(await manager.isStateMode()).toBe(false)
	})

	test('isStateMode is false when the path is a file, not a directory', async () => {
		await fs.writeFile(stateDir, 'not a dir')
		expect(await manager.isStateMode()).toBe(false)
	})

	test('extractState creates the directory and round-trips through readState', async () => {
		await manager.extractState(schemaWithAcl)

		expect(await manager.isStateMode()).toBe(true)

		const state = await manager.readState()
		expect(state.acl).toStrictEqual(schemaWithAcl.acl)
		expect(state.validation).toStrictEqual(schemaWithAcl.validation)
		expect(state.actions).toStrictEqual(schemaWithAcl.actions)
		expect(state.settings).toStrictEqual(schemaWithAcl.settings)
	})

	test('extractState writes one JSON file per state part', async () => {
		await manager.extractState(schemaWithAcl)

		const files = (await fs.readdir(stateDir)).sort()
		expect(files).toStrictEqual(['acl.json', 'actions.json', 'settings.json', 'validation.json'])
	})

	test('writeState in dryRun mode reports a change but does not touch the filesystem', async () => {
		await fs.mkdir(stateDir, { recursive: true })

		const changed = await manager.writeState(SchemaStateManager.schemaStateFromSchema(schemaWithAcl), { dryRun: true })

		expect(changed).toBe(true)
		expect(await fs.readdir(stateDir)).toStrictEqual([])
	})

	test('writeState is idempotent: a second identical write reports no change', async () => {
		const state = SchemaStateManager.schemaStateFromSchema(schemaWithAcl)
		await fs.mkdir(stateDir, { recursive: true })

		expect(await manager.writeState(state)).toBe(true)
		expect(await manager.writeState(state)).toBe(false)
	})

	test('writeState detects a change when a state part differs', async () => {
		await manager.extractState(schemaWithAcl)

		const modified = SchemaStateManager.schemaStateFromSchema({
			...schemaWithAcl,
			acl: { roles: {} },
		})
		expect(await manager.writeState(modified, { dryRun: true })).toBe(true)
	})

	test('readState throws a descriptive error when a state file is missing', async () => {
		await fs.mkdir(stateDir, { recursive: true })
		await fs.writeFile(path.join(stateDir, 'acl.json'), JSON.stringify({ roles: {} }))
		// validation.json / actions.json / settings.json are missing

		await expect(manager.readState()).rejects.toThrow(/Failed to read schema state file/)
	})
})
