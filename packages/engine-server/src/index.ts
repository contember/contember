import { MasterContainerFactory, MasterContainerArgs } from './MasterContainer'
import { ProjectConfig } from '@contember/engine-http'
import { readConfig } from './config/config'
import { serverConfigSchema } from './config/configSchema'
import { TenantConfigResolver } from './config/tenantConfigResolver'
import { ProjectGroupContainerFactory } from './projectGroup/ProjectGroupContainer'

export * from './utils/serverStartup'
export * from './utils/serverTermination'
export * from './utils/sentry'
export * from './MasterContainer'

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
