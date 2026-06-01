import { MasterContainerArgs, MasterContainerFactory } from './MasterContainer.js'
import Koa from 'koa'

export * from './config/config.js'
export * from './config/ConfigProcessor.js'
export * from './config/tenantConfigResolver.js'
export * from './common/index.js'
export * from './content/index.js'
export * from './plugin/Plugin.js'
export * from './misc/index.js'
export * from './project-common/index.js'
export * from './system/index.js'
export * from './tenant/index.js'
export * from './transfer/index.js'
export * from './application/index.js'
export * from './providers.js'
export * from './graphql/index.js'
export * from './project/config.js'
export * from './utils/CryptoWrapper.js'
export * from './project/ProjectContainer.js'
export * from './project/ProjectContainerResolver.js'
export * from './projectGroup/ProjectGroupContainer.js'
export * from './projectGroup/ProjectGroupResolver.js'
export type { ProjectGroupContainerResolver } from './projectGroup/ProjectGroupContainerResolver.js'

export * from './testing/index.js'
export * from './utils/serverStartup.js'
export * from './utils/serverTermination.js'
export * from './utils/sentry.js'
export * from './MasterContainer.js'
export { serverConfigSchema } from './config/configSchema.js'

export const createContainer = (args: MasterContainerArgs) => {
	return new MasterContainerFactory().create(args)
}

export { Koa }
