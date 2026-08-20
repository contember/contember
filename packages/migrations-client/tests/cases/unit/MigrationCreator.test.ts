import { afterEach, beforeEach, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { c, createSchema } from '@contember/schema-definition'
import { emptySchema } from '@contember/schema-utils'
import {
	JsonLoader,
	MigrationCreator,
	MigrationFilesManager,
	MigrationParser,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
} from '../../../src/index.js'

namespace Model {
	export class Article {
		title = c.stringColumn()
	}
}

let workDir: string
const exists = (file: string): Promise<boolean> => fs.stat(file).then(() => true, () => false)

beforeEach(async () => {
	workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contember-migration-creator-'))
})

afterEach(async () => {
	await fs.rm(workDir, { recursive: true, force: true })
})

test('prepareMigration is filesystem-pure and saveMigration creates the directory', async () => {
	const migrationsDir = path.join(workDir, 'migrations')
	const filesManager = new MigrationFilesManager(migrationsDir, { json: new JsonLoader(new MigrationParser()) })
	const migrator = new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap))
	const creator = new MigrationCreator(filesManager, new SchemaDiffer(migrator))

	const prepared = await creator.prepareMigration(emptySchema, createSchema(Model), 'initial')

	expect(prepared).not.toBeNull()
	expect(await exists(migrationsDir)).toBe(false)
	if (prepared === null) {
		throw new Error('Expected a migration')
	}
	const file = await creator.saveMigration(prepared.migration)
	expect(await exists(migrationsDir)).toBe(true)
	expect(await exists(file)).toBe(true)
})
