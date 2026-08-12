import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test'
import { CliError, CommandManager, ExitCode } from '@contember/cli-common'
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
	VERSION_LATEST,
} from '@contember/migrations-client'
import { emptySchema } from '@contember/schema-utils'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { CommandsCommand } from '../../../src/commands/misc/CommandsCommand.js'
import { VersionCommand } from '../../../src/commands/misc/VersionCommand.js'
import { MigrationDescribeCommand } from '../../../src/commands/migrations/MigrationDescribeCommand.js'
import { ProjectGenerateDocumentationCommand } from '../../../src/commands/project/ProjectGenerateDocumentationCommand.js'
import { TenantPersonShowCommand } from '../../../src/commands/tenant/person/TenantPersonShowCommand.js'
import { TenantConfigShowCommand } from '../../../src/commands/tenant/project/TenantConfigShowCommand.js'
import { TenantProjectShowCommand } from '../../../src/commands/tenant/project/TenantProjectShowCommand.js'
import { TenantWhoAmICommand } from '../../../src/commands/tenant/project/TenantWhoAmICommand.js'
import { MigrationPrinter } from '../../../src/lib/migrations/MigrationPrinter.js'
import { RemoteProject } from '../../../src/lib/project/RemoteProject.js'
import { RemoteProjectProvider } from '../../../src/lib/project/RemoteProjectProvider.js'
import { SchemaLoader } from '../../../src/lib/schema/SchemaLoader.js'
import { TenantClientProvider } from '../../../src/lib/TenantClientProvider.js'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'

const API_URL = 'http://tenant.test'
const temporaryDirectories: string[] = []
const requests: { query: string; variables: unknown }[] = []
let tenantResponse: unknown = {}
const originalFetch = globalThis.fetch

beforeAll(() => {
	globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
		const request: { query: string; variables: unknown } = JSON.parse(String(init?.body))
		requests.push(request)
		return new Response(JSON.stringify({ data: tenantResponse }), { status: 200 })
	}
})

afterEach(async () => {
	requests.length = 0
	tenantResponse = {}
	await Promise.all(temporaryDirectories.splice(0).map(directory => fs.rm(directory, { recursive: true, force: true })))
})

afterAll(() => {
	globalThis.fetch = originalFetch
})

const createTenantClientProvider = (): TenantClientProvider => {
	const remoteProjectProvider = new RemoteProjectProvider()
	remoteProjectProvider.setRemoteProject(new RemoteProject('blog', API_URL, 'token'))
	return new TenantClientProvider(remoteProjectProvider)
}

const createMigrationServices = async () => {
	const migrationsDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'contember-structured-output-'))
	temporaryDirectories.push(migrationsDirectory)
	const filesManager = new MigrationFilesManager(migrationsDirectory, { json: new JsonLoader(new MigrationParser()) })
	const migrationsResolver = new MigrationsResolver(filesManager)
	const modificationHandlerFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
	const schemaMigrator = new SchemaMigrator(modificationHandlerFactory)
	const stateManager = new SchemaStateManager(path.join(migrationsDirectory, 'state'))
	return {
		migrationsDirectory,
		migrationsResolver,
		migrationPrinter: new MigrationPrinter(new MigrationDescriber(modificationHandlerFactory)),
		schemaVersionBuilder: new SchemaVersionBuilder(migrationsResolver, schemaMigrator, stateManager),
	}
}

describe('structured command quiet output', () => {
	test('commands discovery prints canonical command names', async () => {
		const command = new CommandsCommand()
		const versionFactory = () => new VersionCommand('1.2.3')
		command.setCommandManager(
			new CommandManager({
				'version show': versionFactory,
				'version:show': versionFactory,
			}),
		)
		const { output, stdout } = createTestOutput()

		await command.run(['--quiet'], output)

		expect(stdout.lines).toEqual(['version show'])
	})

	test('migration describe prints the stable migration version', async () => {
		const services = await createMigrationServices()
		const version = '2026-08-12-120000'
		await fs.writeFile(
			path.join(services.migrationsDirectory, `${version}-empty.json`),
			JSON.stringify({ formatVersion: VERSION_LATEST, modifications: [] }),
		)
		const command = new MigrationDescribeCommand(
			services.migrationPrinter,
			services.schemaVersionBuilder,
			services.migrationsResolver,
		)
		const { output, stdout } = createTestOutput()

		await command.run(['--quiet'], output)

		expect(stdout.lines).toEqual([version])
	})

	test('project documentation prints its output destination', async () => {
		const services = await createMigrationServices()
		const schemaLoader: SchemaLoader = { loadSchema: async () => emptySchema }
		const command = new ProjectGenerateDocumentationCommand(schemaLoader, services.schemaVersionBuilder, async () => '<html>project</html>')
		const { output, stdout } = createTestOutput()
		const destination = path.relative(process.cwd(), path.join(services.migrationsDirectory, 'project.html'))

		await command.run(['--output', destination, '--quiet'], output)

		expect(stdout.lines).toEqual([destination])
	})

	test('person show prints the person id', async () => {
		tenantResponse = {
			personById: {
				id: 'person-1',
				email: 'person@example.test',
				name: 'Person',
				otpEnabled: false,
				emailOtpEnabled: false,
				emailVerified: true,
				passwordlessEnabled: null,
				identity: { id: 'identity-1', roles: [], sessions: [] },
				identityProviders: [],
			},
		}
		const { output, stdout } = createTestOutput()

		await new TenantPersonShowCommand(createTenantClientProvider()).run(['person-1', '--quiet'], output)

		expect(stdout.lines).toEqual(['person-1'])
	})

	test('project show prints the stable project slug', async () => {
		tenantResponse = {
			projectBySlug: { id: 'project-1', name: 'Blog', slug: 'blog', config: {}, roles: [], secrets: [] },
		}
		const { output, stdout } = createTestOutput()

		await new TenantProjectShowCommand(createTenantClientProvider()).run(['blog', '--quiet'], output)

		expect(stdout.lines).toEqual(['blog'])
	})

	test('whoami prints the identity id', async () => {
		tenantResponse = {
			me: { id: 'identity-1', description: null, roles: [], permissions: null, projects: [] },
		}
		const { output, stdout } = createTestOutput()

		await new TenantWhoAmICommand(createTenantClientProvider()).run(['--quiet'], output)

		expect(stdout.lines).toEqual(['identity-1'])
	})

	test('tenant config rejects quiet mode before making a request', async () => {
		const { output, stdout } = createTestOutput()
		let thrown: unknown

		try {
			await new TenantConfigShowCommand(createTenantClientProvider()).run(['--quiet'], output)
		} catch (error) {
			thrown = error
		}

		expect(thrown).toBeInstanceOf(CliError)
		if (thrown instanceof CliError) {
			expect(thrown.code).toBe('QUIET_OUTPUT_UNSUPPORTED')
			expect(thrown.exitCode).toBe(ExitCode.InputError)
		}
		expect(stdout.text).toBe('')
		expect(requests).toHaveLength(0)
	})
})
