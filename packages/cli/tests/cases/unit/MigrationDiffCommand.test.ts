import { afterEach, beforeEach, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import prompts from 'prompts'
import { Schema } from '@contember/schema'
import { c, createSchema } from '@contember/schema-definition'
import { emptySchema } from '@contember/schema-utils'
import {
	JsonLoader,
	MigrationCreator,
	MigrationDescriber,
	MigrationFilesManager,
	MigrationParser,
	MigrationsResolver,
	MigrationState,
	MigrationToExecuteOkStatus,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
	SchemaStateManager,
	SchemaVersionBuilder,
	VERSION_LATEST,
} from '@contember/migrations-client'
import { CliError, ExitCode } from '@contember/cli-common'
import { MigrationDiffCommand } from '../../../src/commands/migrations/MigrationDiffCommand.js'
import { MigrationExecutionFacade } from '../../../src/lib/migrations/MigrationExecutionFacade.js'
import { MigrationPrinter } from '../../../src/lib/migrations/MigrationPrinter.js'
import { SchemaLoader } from '../../../src/lib/schema/SchemaLoader.js'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'

namespace BlogModel {
	export class Article {
		title = c.stringColumn()
	}
}

namespace ExistingModel {
	export class LegacyArticle {
		title = c.stringColumn()
	}
}

const invalidSchema: Schema = {
	...emptySchema,
	acl: {
		roles: {
			admin: { variables: {}, stages: '*', entities: {}, inherits: ['missing'] },
		},
	},
}

let workDir: string

beforeEach(async () => {
	workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contember-diff-command-'))
})

afterEach(async () => {
	await fs.rm(workDir, { recursive: true, force: true })
})

const listTree = async (): Promise<string[]> => {
	const entries: string[] = []
	const visit = async (directory: string, prefix = ''): Promise<void> => {
		for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
			const relative = path.join(prefix, entry.name)
			entries.push(relative)
			if (entry.isDirectory()) {
				await visit(path.join(directory, entry.name), relative)
			}
		}
	}
	await visit(workDir)
	return entries.sort()
}

const buildCommand = async (schema: Schema, existingMigration = false) => {
	const migrationsDir = path.join(workDir, 'migrations')
	const filesManager = new MigrationFilesManager(migrationsDir, { json: new JsonLoader(new MigrationParser()) })
	const modificationFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
	const schemaMigrator = new SchemaMigrator(modificationFactory)
	const schemaDiffer = new SchemaDiffer(schemaMigrator)
	if (existingMigration) {
		await filesManager.createDirIfNotExist()
		await filesManager.createFile(
			JSON.stringify({
				formatVersion: VERSION_LATEST,
				modifications: schemaDiffer.diffSchemas(emptySchema, createSchema(ExistingModel)),
			}),
			'2024-01-01-120000-existing',
		)
	}
	const migrationsResolver = new MigrationsResolver(filesManager)
	const stateManager = new SchemaStateManager(path.join(migrationsDir, 'state'))
	const schemaVersionBuilder = new SchemaVersionBuilder(migrationsResolver, schemaMigrator, stateManager)
	const loader: SchemaLoader = { loadSchema: async () => schema }
	const executionConfirmations: boolean[] = []
	const executor = {
		execute: async (options: Parameters<MigrationExecutionFacade['execute']>[0]) => {
			const migrations = await migrationsResolver.getMigrationFiles()
			const pendingFiles = existingMigration ? migrations : migrations.slice(-1)
			const pending: MigrationToExecuteOkStatus[] = pendingFiles.map(localMigration => ({
				state: MigrationState.TO_EXECUTE_OK,
				version: localMigration.version,
				name: localMigration.name,
				localMigration,
			}))
			executionConfirmations.push(
				typeof options.requireConfirmation === 'function' ? options.requireConfirmation(pending) : options.requireConfirmation,
			)
			return true
		},
	}
	const output = createTestOutput()
	const command = new MigrationDiffCommand(
		loader,
		schemaVersionBuilder,
		new MigrationCreator(filesManager, schemaDiffer),
		new MigrationPrinter(new MigrationDescriber(modificationFactory), output.output),
		executor,
		stateManager,
		migrationsResolver,
	)
	return { command, migrationsDir, executionConfirmations }
}

test('declining a diff leaves a new project filesystem untouched', async () => {
	const { command } = await buildCommand(createSchema(BlogModel))
	const before = await listTree()
	const { output } = createTestOutput({ stdinTty: true, stderrTty: true })
	prompts.inject(['no'])

	const error = await command.run(['change'], output).then(() => null, (reason: unknown) => reason)

	expect(error instanceof CliError ? error.code : null).toBe('OPERATION_ABORTED')
	expect(await listTree()).toStrictEqual(before)
})

test('executing a new diff requires a second confirmation when older migrations are pending', async () => {
	const { command, executionConfirmations } = await buildCommand(createSchema(BlogModel), true)
	const { output } = createTestOutput({ stdinTty: true, stderrTty: true })
	prompts.inject(['yes'])

	await command.run(['change', '--execute'], output)

	expect(executionConfirmations).toStrictEqual([true])
})

test('executing a new diff does not require a redundant second confirmation when it is the only pending migration', async () => {
	const { command, executionConfirmations } = await buildCommand(createSchema(BlogModel))
	const { output } = createTestOutput({ stdinTty: true, stderrTty: true })
	prompts.inject(['yes'])

	await command.run(['change', '--execute'], output)

	expect(executionConfirmations).toStrictEqual([false])
})

test('non-interactive diff refusal leaves a new project filesystem untouched', async () => {
	const { command } = await buildCommand(createSchema(BlogModel))
	const before = await listTree()
	const { output } = createTestOutput({ stdinTty: false })

	const error = await command.run(['change'], output).then(() => null, (reason: unknown) => reason)

	expect(error instanceof CliError ? error.code : null).toBe('TTY_UNAVAILABLE')
	expect(error instanceof CliError ? error.exitCode : null).toBe(ExitCode.InputError)
	expect(await listTree()).toStrictEqual(before)
})

test('an invalid diff returns a structured error without changing the filesystem', async () => {
	const { command } = await buildCommand(invalidSchema, true)
	const before = await listTree()
	const { output, stdout } = createTestOutput()

	const error = await command.run(['change', '--yes', '--json'], output).then(() => null, (reason: unknown) => reason)

	expect(error instanceof CliError ? error.code : null).toBe('SCHEMA_INVALID')
	expect(stdout.text).toBe('')
	expect(await listTree()).toStrictEqual(before)
})
