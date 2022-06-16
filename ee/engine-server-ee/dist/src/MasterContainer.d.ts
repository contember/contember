/// <reference types="koa" />
/// <reference types="koa-bodyparser" />
import { ProcessType } from './utils'
import { Koa, KoaMiddleware } from '@contember/engine-http'
import { ProjectGroupContainerResolver } from './projectGroup/ProjectGroupContainerResolver'
import { MasterContainer as BaseMasterContainer, MasterContainerArgs as BaseMasterContainerArgs, MasterContainerFactory as BaseMasterContainerFactory } from '@contember/engine-server'
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
export declare class MasterContainerFactory {
	private readonly baseContainerFactory
	constructor(baseContainerFactory: BaseMasterContainerFactory)
	createBuilder({ processType, serverConfig, ...args }: MasterContainerArgs): import('@contember/dic').Builder<{
		serverConfig: {
			readonly port: number
			readonly http: {
				readonly requestBodySize?: string | undefined
			}
			readonly logging: {
				sentry?: {
					dsn: string
				} | undefined
			} | {
				readonly sentry?: {
					readonly dsn: string
				} | undefined
			}
		}
	} & {
		debugMode: boolean
	} & {
		version: string | undefined
	} & {
		projectConfigResolver: import('@contember/engine-server/dist/src/config/projectConfigResolver').ProjectConfigResolver
	} & {
		tenantConfigResolver: import('@contember/engine-server').TenantConfigResolver
	} & {
		plugins: import('@contember/engine-plugins').Plugin<Record<string, unknown>>[]
	} & {
		providers: {
			uuid: () => string
			now: () => Date
			bcrypt: (value: string) => Promise<string>
			bcryptCompare: (data: any, hash: string) => Promise<boolean>
			randomBytes: (bytes: number) => Promise<Buffer>
			hash: (value: import('crypto').BinaryLike, algo: string) => Buffer
		}
	} & {
		tenantContainerFactory: import('@contember/engine-tenant-api').TenantContainerFactory
	} & {
		modificationHandlerFactory: import('@contember/schema-migrations/dist/src/modifications/ModificationHandlerFactory').default
	} & {
		systemContainerFactory: import('@contember/engine-system-api').SystemContainerFactory
	} & {
		projectContainerFactoryFactory: import('@contember/engine-server/dist/src/project').ProjectContainerFactoryFactory
	} & {
		tenantGraphQLHandlerFactory: import('@contember/engine-http').TenantGraphQLHandlerFactory
	} & {
		systemGraphQLHandlerFactory: import('@contember/engine-http').SystemGraphQLHandlerFactory
	} & {
		projectGroupContainerFactory: import('@contember/engine-server').ProjectGroupContainerFactory
	} & {
		projectGroupContainer: import('@contember/engine-http').ProjectGroupContainer
	} & {
		httpErrorMiddlewareFactory: import('@contember/engine-http').ErrorMiddlewareFactory
	} & {
		projectGroupResolver: import('@contember/engine-http').ProjectGroupResolver
	} & {
		notModifiedChecker: import('@contember/engine-http').NotModifiedChecker
	} & {
		contentGraphqlContextFactory: import('@contember/engine-http').ContentGraphQLContextFactory
	} & {
		contentQueryHandlerFactory: import('@contember/engine-http').ContentQueryHandlerFactory
	} & {
		contentApiMiddlewareFactory: import('@contember/engine-http').ContentApiMiddlewareFactory
	} & {
		tenantGraphQLContextFactory: import('@contember/engine-http').TenantGraphQLContextFactory
	} & {
		tenantApiMiddlewareFactory: import('@contember/engine-http').TenantApiMiddlewareFactory
	} & {
		systemGraphQLContextFactory: import('@contember/engine-http').SystemGraphQLContextFactory
	} & {
		systemApiMiddlewareFactory: import('@contember/engine-http').SystemApiMiddlewareFactory
	} & {
		koaMiddlewares: KoaMiddleware<any>
	} & {
		koa: Koa<Koa.DefaultState, Koa.DefaultContext>
	} & {
		initializer: import('@contember/engine-server/dist/src/bootstrap').Initializer
	} & {
		processType: ProcessType
	} & {
		projectGroupContainerResolver: ProjectGroupContainerResolver
	} & {
		promRegistryFactory: PrometheusRegistryFactory
	} & {
		projectGroupContainerMetricsHook: ProjectGroupContainerMetricsHook
	} & {
		promRegistry: import('prom-client').Registry
	} & {
		monitoringKoa: Koa<Koa.DefaultState, Koa.DefaultContext>
	}>
	create(args: MasterContainerArgs): MasterContainer
}
//# sourceMappingURL=MasterContainer.d.ts.map
