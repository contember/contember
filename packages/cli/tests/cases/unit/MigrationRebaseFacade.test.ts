import { afterEach, beforeEach, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { c, createSchema } from '@contember/schema-definition'
import { Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'
import {
	JsonLoader,
	MigrationFilesManager,
	MigrationParser,
	MigrationsResolver,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
	SchemaStateManager,
	SchemaVersionBuilder,
	VERSION_LATEST,
} from '@contember/migrations-client'
import { MigrationRebaseFacade } from '../../../src/lib/migrations/MigrationRebaseFacade'

namespace BlogModel {
	export class Author {
		name = c.stringColumn()
	}
}

const aclWith = (role: string): Schema['acl'] => ({
	roles: { [role]: { variables: {}, stages: '*', entities: {} } },
})

let migrationsDir: string

beforeEach(async () => {
	migrationsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contember-rebase-'))
	const schemaDiffer = new SchemaDiffer(new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)))
	const model = createSchema(BlogModel)
	const modifications = schemaDiffer.diffSchemas(emptySchema, model, { skipNonModelDiffers: true })
	await fs.writeFile(
		path.join(migrationsDir, '2024-01-01-120000-init.json'),
		JSON.stringify({ formatVersion: VERSION_LATEST, modifications }, null, '\t'),
	)
	await new SchemaStateManager(path.join(migrationsDir, 'state')).extractState({ ...model, acl: aclWith('admin') })
})

afterEach(async () => {
	await fs.rm(migrationsDir, { recursive: true, force: true })
})

test('rebase re-pushes schema state to the server after rewriting migrations', async () => {
	// migrationModify rebuilds the server schema from migrations, dropping the non-model state;
	// rebase must re-apply it from the state files once the rewrites are done.
	const filesManager = new MigrationFilesManager(migrationsDir, { json: new JsonLoader(new MigrationParser()) })
	const migrationsResolver = new MigrationsResolver(filesManager)
	const schemaMigrator = new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap))
	const schemaStateManager = new SchemaStateManager(path.join(migrationsDir, 'state'))
	const schemaVersionBuilder = new SchemaVersionBuilder(migrationsResolver, schemaMigrator, schemaStateManager)

	const calls: Array<{ method: string; args: any[] }> = []
	const systemClientProvider = {
		get: () => ({
			migrationModify: async (...args: any[]) => {
				calls.push({ method: 'migrationModify', args })
			},
			migrate: async (...args: any[]) => {
				calls.push({ method: 'migrate', args })
			},
		}),
	}
	const migrationsValidator = { validate: () => true }

	const facade = new MigrationRebaseFacade(
		schemaVersionBuilder,
		migrationsValidator as any,
		systemClientProvider as any,
		filesManager,
		schemaStateManager,
	)

	await facade.rebase([...(await migrationsResolver.getSchemaMigrations())])

	const modifyIndex = calls.findIndex(it => it.method === 'migrationModify')
	expect(modifyIndex).toBeGreaterThanOrEqual(0)
	const restate = calls.slice(modifyIndex + 1).find(it => it.method === 'migrate' && it.args[2])
	expect(restate).toBeDefined()
	expect(Object.keys(restate!.args[2].acl.roles)).toStrictEqual(['admin'])
})
