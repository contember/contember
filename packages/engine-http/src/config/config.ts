import { ConfigLoader, createObjectParametersResolver, Merger, resolveParameters } from '@contember/config-loader'

import { serverConfigSchema as defaultServerConfigSchema, tenantConfigSchema } from './configSchema'
import { configTemplate } from './configTemplate'
import { createProjectConfigResolver, ProjectConfigResolver } from './projectConfigResolver'
import { createTenantConfigResolver, TenantConfigResolver } from './tenantConfigResolver'
import { Type } from '@contember/typesafe'
import { ConfigProcessor } from './ConfigProcessor'

export type ServerConfig = ReturnType<typeof defaultServerConfigSchema>
export type TenantConfig = ReturnType<typeof tenantConfigSchema>

export type ConfigSource = { data: string; type: 'file' | 'json' | 'yaml' }

export type Env = Record<string, string>

export async function readConfig<T extends ServerConfig>(
	configSources: ConfigSource[] = [],
	configProcessors: ConfigProcessor<any>[] = [],
	serverConfigSchema: Type<T> = defaultServerConfigSchema as Type<T>,
): Promise<{
	serverConfig: T
	projectConfigResolver: ProjectConfigResolver
	tenantConfigResolver: TenantConfigResolver
}> {
	const loader = new ConfigLoader()
	const configs = await Promise.all(
		configSources.map(it => (it.type === 'file' ? loader.load(it.data) : loader.loadString(it.data, it.type))),
	)
	const env: Env = {
		...configProcessors.reduce((acc, curr) => ({ ...acc, ...(curr.getDefaultEnv?.() || {}) }), {
			DEFAULT_DB_PORT: '5432',
		}),
		...Object.fromEntries(Object.entries(process.env).filter((it): it is [string, string] => it[1] !== undefined)),
	}

	const template = configProcessors.reduce(
		(tpl, processor) => processor.prepareConfigTemplate?.(tpl, { env }) || tpl,
		configTemplate,
	)

	const rawConfig = Merger.merge(template, ...configs)

	const parametersResolver = createObjectParametersResolver({ env })
	const config = resolveParameters(rawConfig.server, parametersResolver)

	const serverConfig = serverConfigSchema(config)
	return {
		serverConfig,
		projectConfigResolver: createProjectConfigResolver(env, rawConfig, configProcessors),
		tenantConfigResolver: createTenantConfigResolver(env, rawConfig.tenant),
	}
}




