import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { MigrationsResolver, SchemaStateManager, SchemaVersionBuilder } from '../../../src/index.js'
import { ModificationHandlerFactory, SchemaMigrator } from '@contember/schema-migrations'
import { emptySchema } from '@contember/schema-utils'
import { Schema } from '@contember/schema'

const schemaMigrator = new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap))

// No migrations on disk — buildSchemaAdvanced reduces to the initial (empty) schema, isolating the state-merge behavior.
const emptyResolver = { getSchemaMigrations: async () => [] } as unknown as MigrationsResolver

const stateAcl: Schema['acl'] = { roles: { admin: { variables: {}, stages: '*', entities: {} } } }

describe('SchemaVersionBuilder schema state merge', () => {
	let baseDir: string
	let stateDir: string
	let stateManager: SchemaStateManager

	beforeEach(async () => {
		baseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contember-svb-'))
		stateDir = path.join(baseDir, 'state')
		stateManager = new SchemaStateManager(stateDir)
	})

	afterEach(async () => {
		await fs.rm(baseDir, { recursive: true, force: true })
	})

	test('buildSchema does not merge state when state mode is off', async () => {
		const builder = new SchemaVersionBuilder(emptyResolver, schemaMigrator, stateManager)

		const schema = await builder.buildSchema()

		expect(schema.acl).toStrictEqual(emptySchema.acl)
	})

	test('buildSchema merges state from disk when state mode is on', async () => {
		await stateManager.extractState({ ...emptySchema, acl: stateAcl })
		const builder = new SchemaVersionBuilder(emptyResolver, schemaMigrator, stateManager)

		const schema = await builder.buildSchema()

		expect(schema.acl).toStrictEqual(stateAcl)
	})

	test('buildSchema with a target version skips the state merge', async () => {
		await stateManager.extractState({ ...emptySchema, acl: stateAcl })
		const builder = new SchemaVersionBuilder(emptyResolver, schemaMigrator, stateManager)

		// The merge is guarded by `!targetVersion`, so requesting a historical version must not pull in current state.
		const schema = await builder.buildSchema('2024-01-01-000000')

		expect(schema.acl).toStrictEqual(emptySchema.acl)
	})
})
