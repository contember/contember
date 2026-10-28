import { describe, expect, test } from 'vitest'
import { Connection } from '@contember/database'
import { DatabaseContextFactory, ProjectInitializer } from '@contember/engine-system-api'
import { DatabaseContext, ProjectWithSecrets } from '@contember/engine-tenant-api'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { createMock } from '../../utils'
import { ContentSchemaResolver } from '../../../src/content/ContentSchemaResolver'
import { GraphQlSchemaFactory } from '../../../src/content/GraphQlSchemaFactory'
import { ProjectContainer, ProjectContainerFactory } from '../../../src/project/ProjectContainer'
import { ProjectContainerResolver } from '../../../src/project/ProjectContainerResolver'
import { ProjectDatabaseMetadataResolver } from '../../../src/project/ProjectDatabaseMetadataResolver'
import { ProjectConfig } from '../../../src/project/config'
import { tenantConfigSchema } from '../../../src/config/configSchema'
import { createProviders } from '../../../src/providers'

const unavailable = (): never => {
	throw new Error('Unused test dependency')
}

const createHarness = () => {
	const logger = createLogger(new TestLoggerHandler())
	const providers = createProviders()
	const db = { host: 'localhost', port: 5432, user: 'test', password: 'test', database: 'test' }
	const connection = Connection.create(db, () => {})
	const systemDatabaseContextFactory = new DatabaseContextFactory('system', providers)
	const project: ProjectWithSecrets = {
		id: 'b1f4c3e2-7d6a-4b5c-9e8f-0a1b2c3d4e5f',
		slug: 'blog',
		name: 'Blog',
		config: {},
		secrets: {},
		updatedAt: new Date(),
	}
	const projectConfig: ProjectConfig = {
		slug: project.slug,
		name: project.name,
		stages: [],
		db,
	}

	let initialize = async () => {}
	const factory = createMock<ProjectContainerFactory>({
		createContainer: (): ProjectContainer => ({
			project: projectConfig,
			logger,
			connection,
			readConnection: connection,
			systemDatabaseContextFactory,
			systemDatabaseContext: systemDatabaseContextFactory.create(connection),
			systemReadDatabaseContext: systemDatabaseContextFactory.create(connection),
			graphQlSchemaFactory: createMock<GraphQlSchemaFactory>({ create: unavailable }),
			contentSchemaResolver: createMock<ContentSchemaResolver>({ clearCache: unavailable, getSchema: unavailable }),
			projectDatabaseMetadataResolver: createMock<ProjectDatabaseMetadataResolver>({ resolveDatabaseMetadata: unavailable }),
			projectInitializer: createMock<ProjectInitializer>({ initialize: () => initialize() }),
		}),
	})

	const resolver = new ProjectContainerResolver(
		factory,
		() => projectConfig,
		{
			getProjectState: async () => 'valid',
			getProjectWithSecretsBySlug: async () => project,
		},
		new DatabaseContext(connection.createClient('tenant', {}), { ...providers, encrypt: unavailable, decrypt: unavailable }),
		tenantConfigSchema({ db, mailer: {}, credentials: {}, secrets: {} }),
	)

	// Mimics a per-container registration such as the pool metrics: registered on 'create', released by its cleanup.
	const registered = new Set<ProjectContainer>()
	resolver.on('create', ({ container }) => {
		registered.add(container)
		return () => registered.delete(container)
	})
	const destroyed: ProjectContainer[] = []
	resolver.on('destroy', ({ container }) => {
		destroyed.push(container)
	})

	return {
		project,
		resolver,
		registered,
		destroyed,
		setInitialize: (fn: () => Promise<void>) => {
			initialize = fn
		},
	}
}

describe('project container resolver disposal', () => {
	test('dispose destroys cached containers', async () => {
		const { resolver, registered, destroyed } = createHarness()
		const container = await resolver.getProjectContainer('blog')
		expect(registered.size).toBe(1)

		await resolver.dispose()

		expect(registered.size).toBe(0)
		expect(destroyed).toHaveLength(1)
		expect(container).toBe(destroyed[0])
	})

	test('a request still holding a disposed resolver gets an untracked container', async () => {
		const { resolver, registered } = createHarness()
		const before = await resolver.getProjectContainer('blog')
		await resolver.dispose()

		const late = await resolver.getProjectContainer('blog')
		const lateAgain = await resolver.getProjectContainer('blog')

		expect(late).toBeDefined()
		expect(late).not.toBe(before)
		expect(lateAgain).not.toBe(late)
		expect(registered.size).toBe(0)
	})

	test('a container still initializing when the resolver is disposed is released once it is ready', async () => {
		const { resolver, registered, destroyed, setInitialize } = createHarness()
		let finishInitialization = () => {}
		const initializationStarted = new Promise<void>(started => {
			setInitialize(() =>
				new Promise<void>(resolve => {
					finishInitialization = resolve
					started()
				}),
			)
		})

		const pending = resolver.getProjectContainer('blog')
		await initializationStarted
		const disposed = resolver.dispose()
		finishInitialization()

		const container = await pending
		await disposed

		expect(container).toBeDefined()
		expect(registered.size).toBe(0)
		expect(destroyed).toHaveLength(1)
		expect(container).toBe(destroyed[0])
	})

	test('createProjectContainer after dispose does not register the container', async () => {
		const { project, resolver, registered } = createHarness()
		await resolver.dispose()

		await resolver.createProjectContainer(project)

		expect(registered.size).toBe(0)
	})
})
