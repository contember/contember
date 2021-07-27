import {
	ContentApplyDependenciesFactoryImpl,
	ContentEventApplier,
	createMapperContainer,
	EntitiesSelector,
	EntitiesSelectorMapperFactory,
	PermissionsByIdentityFactory,
} from '@contember/engine-content-api'
import { SystemContainerFactory } from '@contember/engine-system-api'
import { ProjectInitializer, ProjectSchemaResolver } from '@contember/engine-tenant-api'
import getTenantMigrations from '@contember/engine-tenant-api/migrations'
import getSystemMigrations from '@contember/engine-system-api/migrations'
import { Builder } from '@contember/dic'
import { Config } from './config/config'
import { createDbMetricsRegistrar, logSentryError, ProcessType } from './utils'
import { ModificationHandlerFactory } from '@contember/schema-migrations'
import { Initializer } from './bootstrap'
import { Plugin } from '@contember/engine-plugins'
import { DatabaseCredentials, MigrationsRunner } from '@contember/database-migrations'
import { createRootMiddleware, createShowMetricsMiddleware } from './http'
import {
	createProviders,
	Koa,
	ProjectConfigResolver,
	SystemGraphQLMiddlewareFactory,
	TenantGraphQLMiddlewareFactory,
} from '@contember/engine-http'
import prom from 'prom-client'
import { ProjectContainerResolver } from './ProjectContainerResolver'
import { TenantContainerFactory } from '@contember/engine-tenant-api'
import { Logger } from '@contember/engine-common'
import { ClientBase } from 'pg'
import { createSecretKey } from 'crypto'

export interface MasterContainer {
	initializer: Initializer
	koa: Koa
	monitoringKoa: Koa
	projectContainerResolver: ProjectContainerResolver
}

class CompositionRoot {
	createMasterContainer(
		debugMode: boolean,
		config: Config,
		projectConfigResolver: ProjectConfigResolver,
		plugins: Plugin[],
		processType: ProcessType = ProcessType.singleNode,
	): MasterContainer {
		let projectSchemaResolverInner: ProjectSchemaResolver = () => {
			throw new Error('called too soon')
		}
		const projectSchemaResolver: ProjectSchemaResolver = slug => projectSchemaResolverInner(slug)

		let projectInitializerInner: ProjectInitializer = () => {
			throw new Error('called too soon')
		}
		const providers = createProviders({
			encryptionKey: config.tenant.secrets
				? createSecretKey(Buffer.from(config.tenant.secrets.encryptionKey, 'hex'))
				: undefined,
		})
		const tenantContainer = new TenantContainerFactory().create({
			tenantDbCredentials: config.tenant.db,
			mailOptions: config.tenant.mailer,
			projectSchemaResolver: projectSchemaResolver,
			providers,
			projectInitializer: async slug => {
				return await projectInitializerInner(slug)
			},
		})

		const systemContainerDependencies = new Builder({})
			.addService('providers', () => providers)
			.addService(
				'modificationHandlerFactory',
				() => new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap),
			)
			.addService('permissionsByIdentityFactory', ({}) => new PermissionsByIdentityFactory())
			.addService('entitiesSelector', ({ permissionsByIdentityFactory }) => {
				const mapperFactory: EntitiesSelectorMapperFactory = (db, schema, identityVariables, permissions) =>
					createMapperContainer({
						schema,
						identityVariables,
						permissions,
						providers,
					}).mapperFactory(db)
				return new EntitiesSelector(mapperFactory, permissionsByIdentityFactory)
			})
			.addService('identityFetcher', () => tenantContainer.identityFetcher)
			.addService('eventApplier', () => {
				return new ContentEventApplier(new ContentApplyDependenciesFactoryImpl())
			})
			.addService(
				'systemDbMigrationsRunnerFactory',
				() => (db: DatabaseCredentials, dbClient: ClientBase) =>
					new MigrationsRunner(db, 'system', getSystemMigrations, dbClient),
			)
			.build()
		const systemContainer = new SystemContainerFactory().create(systemContainerDependencies)

		const projectContainerResolver = new ProjectContainerResolver(
			debugMode,
			projectConfigResolver,
			tenantContainer.projectManager,
			plugins,
			systemContainer.schemaVersionBuilder,
			providers,
		)

		projectSchemaResolverInner = async project => {
			const container = await projectContainerResolver.getProjectContainer(project)
			if (!container) {
				return undefined
			}
			const db = container.systemDatabaseContextFactory.create(undefined)
			return await systemContainer.schemaVersionBuilder.buildSchema(db)
		}

		projectInitializerInner = async project => {
			const container = await projectContainerResolver.createProjectContainer(project)
			if (!container) {
				throw new Error('Should not happen')
			}
			const log: string[] = []
			try {
				await systemContainer.projectInitializer.initialize(
					container.systemDatabaseContextFactory,
					container.project,
					new Logger(log.push),
				)
			} catch (e) {
				await projectContainerResolver.destroyContainer(project.slug)
				throw e
			}
			return { log }
		}

		const masterContainer = new Builder({})
			.addService('providers', () => providers)
			.addService('tenantContainer', () => tenantContainer)
			.addService('projectContainerResolver', () => projectContainerResolver)

			.addService(
				'tenantGraphQlMiddlewareFactory',
				({ tenantContainer }) =>
					new TenantGraphQLMiddlewareFactory(
						tenantContainer.resolvers,
						tenantContainer.resolverContextFactory,
						logSentryError,
					),
			)
			.addService(
				'systemGraphQLMiddlewareFactory',
				() =>
					new SystemGraphQLMiddlewareFactory(
						systemContainer.systemResolversFactory,
						systemContainer.resolverContextFactory,
						logSentryError,
						debugMode,
					),
			)

			.addService('promRegistry', ({ projectContainerResolver }) => {
				if (processType === ProcessType.clusterMaster) {
					const register = new prom.AggregatorRegistry()
					prom.collectDefaultMetrics({ register })
					return register
				}
				const register = prom.register
				prom.collectDefaultMetrics({ register })
				const registrar = createDbMetricsRegistrar(register)
				registrar({ connection: tenantContainer.connection, module: 'tenant', project: 'unknown' })
				projectContainerResolver.onCreate.push(container =>
					registrar({
						connection: container.connection,
						module: 'project',
						project: container.project.slug,
					}),
				)
				return register
			})
			.addService(
				'koa',
				({
					tenantGraphQlMiddlewareFactory,
					projectContainerResolver,
					tenantContainer,
					providers,
					systemGraphQLMiddlewareFactory,
					promRegistry,
				}) => {
					const app = new Koa()
					app.use(
						createRootMiddleware(
							debugMode,
							{
								tenantGraphQlMiddlewareFactory,
								projectContainerResolver: projectContainerResolver.getProjectContainer.bind(projectContainerResolver),
								apiKeyManager: tenantContainer.apiKeyManager,
								projectMemberManager: tenantContainer.projectMemberManager,
								providers,
								systemGraphQLMiddlewareFactory,
							},
							promRegistry,
							config.server.http,
						),
					)

					return app
				},
			)
			.addService('monitoringKoa', ({ promRegistry }) => {
				const app = new Koa()
				app.use(createShowMetricsMiddleware(promRegistry))

				return app
			})
			.addService('tenantMigrationsRunner', () => new MigrationsRunner(config.tenant.db, 'tenant', getTenantMigrations))
			.addService(
				'initializer',
				({ tenantMigrationsRunner }) =>
					new Initializer(
						tenantMigrationsRunner,
						tenantContainer.projectManager,
						systemContainer.projectInitializer,
						projectContainerResolver,
						config.tenant.credentials,
						providers,
					),
			)
			.build()

		return masterContainer.pick('initializer', 'koa', 'monitoringKoa', 'projectContainerResolver')
	}
}

export default CompositionRoot
