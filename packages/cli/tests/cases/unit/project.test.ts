import { afterEach, beforeAll, describe, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import chalk from 'chalk'
import { Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'
import {
	JsonLoader,
	MigrationDescriber,
	MigrationFilesManager,
	MigrationParser,
	MigrationsResolver,
	ModificationHandlerFactory,
	SchemaMigrator,
	SchemaStateManager,
	SchemaVersionBuilder,
} from '@contember/migrations-client'
import { SchemaDiffer } from '@contember/schema-migrations'
import { Application, CommandFactoryList, CommandManager, ExitCode, Output, OutputStream } from '@contember/cli-common'
import { SchemaLoader } from '../../../src/lib/schema/SchemaLoader.js'
import { MigrationsValidator } from '../../../src/lib/migrations/MigrationsValidator.js'
import { ProjectPrintSchemaCommand } from '../../../src/commands/project/ProjectPrintSchemaCommand.js'
import { ProjectValidateCommand } from '../../../src/commands/project/ProjectValidateCommand.js'

beforeAll(() => {
	// deterministic assertions regardless of the terminal the suite runs in
	chalk.level = 0
})

class CapturingStream implements OutputStream {
	public chunks: string[] = []
	constructor(public readonly isTty: boolean = false) {}
	write(text: string): void {
		this.chunks.push(text)
	}
	get text(): string {
		return this.chunks.join('')
	}
}

const createOutput = () => {
	const stdout = new CapturingStream()
	const stderr = new CapturingStream()
	return { stdout, stderr, output: new Output({ stdout, stderr }) }
}

const tmpDirs: string[] = []
afterEach(async () => {
	await Promise.all(tmpDirs.splice(0).map(dir => fs.rm(dir, { recursive: true, force: true })))
})

// Wires the project commands with real (but empty) migrations-client services backed by an empty temp dir,
// so `getSchemaMigrations()` resolves to `[]` and `buildSchema()` resolves to `emptySchema` — only the
// "defined schema" (schemaLoader) varies per test.
const buildProjectCommands = async (definedSchema: Schema) => {
	const migrationsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contember-project-'))
	tmpDirs.push(migrationsDir)

	const filesManager = new MigrationFilesManager(migrationsDir, { json: new JsonLoader(new MigrationParser()) })
	const migrationsResolver = new MigrationsResolver(filesManager)
	const modificationHandlerFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
	const schemaMigrator = new SchemaMigrator(modificationHandlerFactory)
	const schemaStateManager = new SchemaStateManager(path.join(migrationsDir, 'state'))
	const schemaVersionBuilder = new SchemaVersionBuilder(migrationsResolver, schemaMigrator, schemaStateManager)
	const schemaDiffer = new SchemaDiffer(schemaMigrator)
	const migrationsValidator = new MigrationsValidator(new MigrationDescriber(modificationHandlerFactory), schemaMigrator, createOutput().output)
	const schemaLoader: SchemaLoader = { loadSchema: async () => definedSchema }

	return {
		validateCommand: new ProjectValidateCommand(schemaLoader, migrationsValidator, migrationsResolver, schemaDiffer, schemaVersionBuilder),
		printSchemaCommand: new ProjectPrintSchemaCommand(schemaLoader, schemaVersionBuilder),
	}
}

const runApplication = async (args: string[], commands: CommandFactoryList) => {
	const io = createOutput()
	const application = new Application(new CommandManager(commands), 'Test CLI', io.output)
	const exitCode = await application.execute(args)
	return { exitCode, stdout: io.stdout.text, stderr: io.stderr.text }
}

// a role inheriting from a role that does not exist — one deterministic ACL_UNDEFINED_ROLE error
const schemaWithKnownError: Schema = {
	...emptySchema,
	acl: {
		roles: {
			admin: { variables: {}, stages: '*', entities: {}, inherits: ['ghost'] },
		},
	},
}

describe('project validate', () => {
	test('--json emits one error envelope with structured issues and leaves stdout empty', async () => {
		const { validateCommand } = await buildProjectCommands(schemaWithKnownError)
		const { exitCode, stdout, stderr } = await runApplication(
			['project', 'validate', '--json'],
			{ ['project validate']: () => validateCommand },
		)

		expect(exitCode).toBe(ExitCode.InputError)

		expect(stdout).toBe('')
		const envelope = JSON.parse(stderr)
		expect(envelope.error.details).toStrictEqual([
			{ source: 'schema', path: 'acl.admin.inherits.ghost', code: 'ACL_UNDEFINED_ROLE', message: 'Referenced role not exists.' },
		])
		expect(envelope.ok).toBe(false)
		expect(envelope.error.code).toBe('SCHEMA_INVALID')
		expect(envelope.error.retryable).toBe(false)
	})

	test('--json emits an empty array and exits 0 for a valid, in-sync project', async () => {
		const { validateCommand } = await buildProjectCommands(emptySchema)
		const { exitCode, stdout, stderr } = await runApplication(
			['project', 'validate', '--json'],
			{ ['project validate']: () => validateCommand },
		)

		expect(exitCode).toBe(ExitCode.Success)
		expect(JSON.parse(stdout)).toStrictEqual([])
		expect(stderr).toBe('')
	})

	test('human mode renders a readable table on stdout and the summary error on stderr', async () => {
		const { validateCommand } = await buildProjectCommands(schemaWithKnownError)
		const { exitCode, stdout, stderr } = await runApplication(
			['project', 'validate'],
			{ ['project validate']: () => validateCommand },
		)

		expect(exitCode).toBe(ExitCode.InputError)
		expect(stdout).toContain('ACL_UNDEFINED_ROLE')
		expect(stdout).toContain('acl.admin.inherits.ghost')
		expect(stderr).toContain('SCHEMA_INVALID')
	})

	test('human mode prints nothing but a success diagnostic for a valid project', async () => {
		const { validateCommand } = await buildProjectCommands(emptySchema)
		const { exitCode, stdout, stderr } = await runApplication(
			['project', 'validate'],
			{ ['project validate']: () => validateCommand },
		)

		expect(exitCode).toBe(ExitCode.Success)
		expect(stdout).toBe('')
		expect(stderr).toContain('Project schema is valid')
	})
})

describe('project print-schema — --format and --json are orthogonal', () => {
	test('--format graphql (default) prints raw SDL text, not JSON', async () => {
		const { printSchemaCommand } = await buildProjectCommands(emptySchema)
		const { exitCode, stdout } = await runApplication(
			['project', 'print-schema'],
			{ ['project print-schema']: () => printSchemaCommand },
		)

		expect(exitCode).toBe(ExitCode.Success)
		expect(stdout.startsWith('"')).toBe(false)
		expect(() => JSON.parse(stdout)).toThrow()
	})

	test('--format graphql --json wraps the same SDL text as a single JSON string (not double-encoded)', async () => {
		const { printSchemaCommand: human } = await buildProjectCommands(emptySchema)
		const { printSchemaCommand: json } = await buildProjectCommands(emptySchema)
		const plain = await runApplication(['project', 'print-schema'], { ['project print-schema']: () => human })
		const wrapped = await runApplication(['project', 'print-schema', '--json'], { ['project print-schema']: () => json })

		expect(wrapped.exitCode).toBe(ExitCode.Success)
		const parsed = wrapped.stdout
		const decoded = JSON.parse(parsed)
		expect(typeof decoded).toBe('string')
		expect(decoded).toBe(plain.stdout.replace(/\n$/, ''))
	})

	test('--format graphql --quiet preserves the raw multi-line SDL', async () => {
		const { printSchemaCommand: human } = await buildProjectCommands(emptySchema)
		const { printSchemaCommand: quiet } = await buildProjectCommands(emptySchema)
		const plain = await runApplication(['project', 'print-schema'], { ['project print-schema']: () => human })
		const minimal = await runApplication(['project', 'print-schema', '--quiet'], { ['project print-schema']: () => quiet })

		expect(minimal.exitCode).toBe(ExitCode.Success)
		expect(minimal.stdout).toBe(plain.stdout)
	})

	test('--format introspection already produces JSON; --json prints the same object once, not a re-encoded string', async () => {
		const { printSchemaCommand } = await buildProjectCommands(emptySchema)
		const { exitCode, stdout } = await runApplication(
			['project', 'print-schema', '--format', 'introspection', '--json'],
			{ ['project print-schema']: () => printSchemaCommand },
		)

		expect(exitCode).toBe(ExitCode.Success)
		const decoded = JSON.parse(stdout)
		// a double-encoded payload would decode to a string, not an object
		expect(typeof decoded).toBe('object')
		expect(Array.isArray(decoded.entities)).toBe(true)
	})

	test('--format introspection without --json still prints valid (tab-indented) JSON', async () => {
		const { printSchemaCommand } = await buildProjectCommands(emptySchema)
		const { exitCode, stdout } = await runApplication(
			['project', 'print-schema', '--format', 'introspection'],
			{ ['project print-schema']: () => printSchemaCommand },
		)

		expect(exitCode).toBe(ExitCode.Success)
		expect(JSON.parse(stdout)).toStrictEqual({ enums: [], entities: [] })
	})

	test('an unknown format is a stable InputError, not a crash', async () => {
		const { printSchemaCommand } = await buildProjectCommands(emptySchema)
		const { exitCode, stdout, stderr } = await runApplication(
			['project', 'print-schema', '--format', 'yaml', '--json'],
			{ ['project print-schema']: () => printSchemaCommand },
		)

		expect(exitCode).toBe(ExitCode.InputError)
		expect(stdout).toBe('')
		expect(JSON.parse(stderr).error.code).toBe('UNKNOWN_FORMAT')
	})
})
