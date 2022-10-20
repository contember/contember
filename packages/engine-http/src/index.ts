import { MasterContainerArgs, MasterContainerFactory } from './MasterContainer'
import Koa from 'koa'

export * from './config/config'
export * from './config/ConfigProcessor'
export * from './config/tenantConfigResolver'
export * from './common'
export * from './content'
export * from './plugin/Plugin'
export * from './misc'
export * from './project-common'
export * from './system'
export * from './tenant'
export * from './transfer'
export * from './koa'
export * from './providers'
export * from './graphql'
export * from './project/config'
export * from './utils/CryptoWrapper'
export * from './project/ProjectContainer'
export * from './project/ProjectContainerResolver'
export * from './projectGroup/ProjectGroupContainer'
export * from './projectGroup/ProjectGroupResolver'

export * from './utils/serverStartup'
export * from './utils/serverTermination'
export * from './utils/sentry'
export * from './MasterContainer'
export { serverConfigSchema } from './config/configSchema'

export const createContainer = (args: MasterContainerArgs) => {
	return new MasterContainerFactory().create(args)
}

export { Koa }
