import { afterEach, beforeEach, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import { join, resolve } from 'node:path'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { emptySchema } from '@contember/schema-utils'
import { ModificationHandlerFactory, SchemaDiffer, SchemaMigrator, VERSION_LATEST } from '@contember/schema-migrations'
import { apiUrl, rand, rootToken } from '../../src/tester'

namespace AuthorModel {
	export class Author {
		name = def.stringColumn()
	}
}

namespace AuthorCategoryModel {
	export class Author {
		name = def.stringColumn()
	}

	export class Category {
		title = def.stringColumn()
	}
}

const repoRoot = resolve(import.meta.dir, '../../..')
const cliEntry = join(repoRoot, 'packages/cli/src/run.ts')
const differ = new SchemaDiffer(new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)))

let workspace: string
let migrationsDir: string

beforeEach(async () => {
	workspace = await fs.mkdtemp(join(os.tmpdir(), 'contember-cli-snapshot-'))
	migrationsDir = join(workspace, 'api/migrations')
	await fs.mkdir(migrationsDir, { recursive: true })

	const schemaA = createSchema(AuthorModel)
	const schemaAB = createSchema(AuthorCategoryModel)
	await fs.writeFile(
		join(migrationsDir, '2024-07-01-120000-a.json'),
		JSON.stringify({ formatVersion: VERSION_LATEST, modifications: differ.diffSchemas(emptySchema, schemaA) }, null, '\t'),
	)
	await fs.writeFile(
		join(migrationsDir, '2024-07-02-120000-b.json'),
		JSON.stringify({ formatVersion: VERSION_LATEST, modifications: differ.diffSchemas(schemaA, schemaAB) }, null, '\t'),
	)
})

afterEach(async () => {
	await fs.rm(workspace, { recursive: true, force: true })
})

const runCli = async (args: string[], extraEnv: Record<string, string> = {}) => {
	const proc = Bun.spawn(['bun', '--conditions=typescript', cliEntry, ...args], {
		cwd: repoRoot,
		env: { ...process.env, CONTEMBER_SKIP_VERSION_CHECK: '1', CONTEMBER_DIR: workspace, ...extraEnv },
		stdout: 'pipe',
		stderr: 'pipe',
	})
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	])
	return { stdout, stderr, exitCode }
}

const systemData = async (project: string, query: string) => {
	const res = await fetch(`${apiUrl}/system/${project}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rootToken}` },
		body: JSON.stringify({ query }),
	})
	return (await res.json() as { data: any }).data
}

test('CLI: migrations:snapshot + migrations:execute bootstraps a fresh project from the snapshot', async () => {
	const snapshotResult = await runCli(['migrations:snapshot'])
	expect(snapshotResult.exitCode).toBe(0)
	expect(snapshotResult.stdout).toContain('Snapshot created: 2 migrations')

	// the snapshot file is written next to the migrations
	expect(await fs.stat(join(migrationsDir, 'snapshot.json')).then(() => true, () => false)).toBe(true)

	const project = `test_${rand()}`
	const env = {
		CONTEMBER_API_URL: apiUrl,
		CONTEMBER_API_TOKEN: rootToken,
		CONTEMBER_PROJECT_NAME: project,
	}

	const executeResult = await runCli(['migrations:execute', '--yes'], env)
	expect(executeResult.exitCode).toBe(0)
	expect(executeResult.stdout).toContain('Bootstrapping from snapshot')
	expect(executeResult.stdout).toContain('Snapshot applied')

	// the collapsed migrations are recorded as executed
	const data = await systemData(project, `query { executedMigrations { version } }`)
	expect(data.executedMigrations).toStrictEqual([{ version: '2024-07-01-120000' }, { version: '2024-07-02-120000' }])

	// the content API serves the bootstrapped schema — both collapsed entities are live
	const content = await fetch(`${apiUrl}/content/${project}/live`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rootToken}` },
		body: JSON.stringify({ query: `query { listAuthor { id } listCategory { id } }` }),
	})
	expect(content.status).toBe(200)
	expect((await content.json() as { errors?: unknown }).errors).toBeUndefined()

	// re-running execute on the now non-empty project does not use the snapshot
	const rerun = await runCli(['migrations:execute', '--yes'], env)
	expect(rerun.exitCode).toBe(0)
	expect(rerun.stdout).not.toContain('Bootstrapping from snapshot')
	expect(rerun.stdout).toContain('No migrations to execute')
}, 60000)
