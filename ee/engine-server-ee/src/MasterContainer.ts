import { ProcessType } from './utils'
import { createColllectHttpMetricsMiddleware, createShowMetricsMiddleware } from './http'
import {
	CryptoWrapper,
	Koa,
	MasterContainer as BaseMasterContainer,
	MasterContainerArgs as BaseMasterContainerArgs,
	MasterContainerFactory as BaseMasterContainerFactory,
} from '@contember/engine-http'
import { createSecretKey } from 'crypto'
import { ProjectGroupContainerResolver } from './projectGroup/ProjectGroupContainerResolver'
import { ProjectGroupResolver } from './projectGroup/ProjectGroupResolver'
import { ServerConfig } from './config/configSchema'
import { PrometheusRegistryFactory } from './prometheus/PrometheusRegistryFactory'
import { ProjectGroupContainerMetricsHook } from './prometheus/ProjectGroupContainerMetricsHook'

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
			.addService('promRegistryFactory', ({ processType }) =>
				new PrometheusRegistryFactory(processType, { version: args.version }))
			.addService('projectGroupContainerMetricsHook', ({ projectGroupContainerResolver }) =>
				new ProjectGroupContainerMetricsHook(projectGroupContainerResolver))
			.addService('promRegistry', ({ promRegistryFactory, projectGroupContainerMetricsHook }) => {
				const registry = promRegistryFactory.create()
				projectGroupContainerMetricsHook.register(registry)
				return registry
			})
			.setupService('application', (app, { promRegistry }) => {
				app.addMiddleware(createColllectHttpMetricsMiddleware(promRegistry))
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
		return container.pick('initializer', 'application', 'monitoringKoa', 'providers')
	}
}
