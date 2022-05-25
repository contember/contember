import { createDbMetricsRegistrar, ProcessType } from './utils'
import { createColllectHttpMetricsMiddleware, createShowMetricsMiddleware } from './http'
import { compose, CryptoWrapper, Koa, KoaMiddleware } from '@contember/engine-http'
import prom, { Gauge } from 'prom-client'
import { createSecretKey } from 'crypto'
import { ProjectGroupContainerResolver } from './projectGroup/ProjectGroupContainerResolver'
import { ProjectGroupResolver } from './projectGroup/ProjectGroupResolver'
import {
	MasterContainer as BaseMasterContainer,
	MasterContainerArgs as BaseMasterContainerArgs,
	MasterContainerFactory as BaseMasterContainerFactory,
} from '@contember/engine-server'
import { ServerConfig } from './config/configSchema'

export interface MasterContainer extends BaseMasterContainer {
	monitoringKoa: Koa
}

export interface MasterContainerArgs extends BaseMasterContainerArgs {
	serverConfig: ServerConfig
	processType: ProcessType
}

export class MasterContainerFactory {
	constructor(
		private readonly baseContainerFactory: BaseMasterContainerFactory,
	) {
	}

	createBuilder({ processType, serverConfig, ...args }: MasterContainerArgs) {
		return this.baseContainerFactory.createBuilder({ ...args, serverConfig })
			.addService('processType', () =>
				processType)
			.addService('projectGroupContainerResolver', ({ tenantConfigResolver, projectGroupContainerFactory }) =>
				new ProjectGroupContainerResolver(tenantConfigResolver, projectGroupContainerFactory))
			.addService('promRegistry', ({ processType, projectGroupContainerResolver }) => {
				if (processType === ProcessType.clusterMaster) {
					const register = new prom.AggregatorRegistry()
					prom.collectDefaultMetrics({ register })
					return register
				}
				const register = prom.register
				const contemberVersion = new Gauge({
					help: 'Current contember version',
					name: 'contember_info',
					labelNames: ['version'],
				})
				contemberVersion.set({
					version: args.version,
				}, 1)
				register.registerMetric(contemberVersion)
				prom.collectDefaultMetrics({ register })
				const registrar = createDbMetricsRegistrar(register)
				projectGroupContainerResolver.onCreate.push((groupContainer, slug) => {
					groupContainer.projectContainerResolver.onCreate.push(projectContainer =>
						registrar({
							connection: projectContainer.connection,
							labels: {
								contember_module: 'content',
								contember_project: projectContainer.project.slug,
								contember_project_group: slug ?? 'unknown',
							},
						}),
					)
					return registrar({
						connection: groupContainer.tenantContainer.connection,
						labels: {
							contember_module: 'tenant',
							contember_project_group: slug ?? 'unknown',
							contember_project: 'unknown',
						},
					})
				})
				return register
			})
			.replaceService<'koaMiddlewares', KoaMiddleware<any>>('koaMiddlewares', ({ inner, promRegistry }) => {
				return compose([
					createColllectHttpMetricsMiddleware(promRegistry),
					inner,
				])
			})
			.replaceService('projectGroupResolver', ({ projectGroupContainerResolver }) => {
				const encryptionKey = serverConfig.projectGroup?.configEncryptionKey
					? createSecretKey(Buffer.from(serverConfig.projectGroup?.configEncryptionKey, 'hex'))
					: undefined
				return new ProjectGroupResolver(
					serverConfig.projectGroup?.domainMapping,
					serverConfig.projectGroup?.configHeader,
					serverConfig.projectGroup?.configEncryptionKey ? new CryptoWrapper(encryptionKey) : undefined,
					projectGroupContainerResolver,
				)
			})
			.addService('monitoringKoa', ({ promRegistry }) => {
				const app = new Koa()
				app.use(createShowMetricsMiddleware(promRegistry))

				return app
			})
	}

	create(args: MasterContainerArgs): MasterContainer {
		const container = this.createBuilder(args).build()
		return container.pick('initializer', 'koa', 'monitoringKoa', 'providers')
	}
}
