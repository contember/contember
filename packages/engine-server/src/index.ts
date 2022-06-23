import { MasterContainerFactory, MasterContainerArgs } from './MasterContainer.js'
import { ProjectConfig } from '@contember/engine-http'
import { readConfig } from './config/config.js'
import { serverConfigSchema } from './config/configSchema.js'
import { TenantConfigResolver } from './config/tenantConfigResolver.js'
import { ProjectGroupContainerFactory } from './projectGroup/ProjectGroupContainer.js'

export * from './utils/serverStartup.js'
export * from './utils/serverTermination.js'
export * from './utils/sentry.js'
export * from './MasterContainer.js'

export {
	ProjectConfig,
	readConfig,
	serverConfigSchema,
	TenantConfigResolver,
	ProjectGroupContainerFactory,
}

export const createContainer = (args: MasterContainerArgs) => {
	return new MasterContainerFactory().create(args)
}
