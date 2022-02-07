import { ConfigLoader, createObjectParametersResolver, Merger, resolveParameters } from '@contember/config-loader'
import { ConfigProcessor } from '@contember/engine-plugins'
import { configSchema } from './configSchema'
import { configTemplate } from './configTemplate'
import { createProjectConfigResolver, ProjectConfigResolver } from './projectConfigResolver'
import {
	createTenantConfigResolver,
	createTenantParametersResolver,
	TenantConfigResolver,
} from './tenantConfigResolver'

export type Config = ReturnType<typeof configSchema>
export type TenantConfig = Config['tenant']

export type ConfigSource = { data: string; type: 'file' | 'json' | 'yaml' }

type Env = Record<string, string>

export async function readConfig(
	configSources: ConfigSource[],
	configProcessors: ConfigProcessor[] = [],
): Promise<{
	config: Config
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
	let { projectDefaults, ...config } = rawConfig

	const parametersResolver = createObjectParametersResolver({ env })
	const tenantParametersResolver = createTenantParametersResolver(env)
	config = resolveParameters(config, (parts, path, dataResolver) => {
		if (parts[0] === 'tenant' && path[0] === 'tenant') {
			return tenantParametersResolver(parts, path, dataResolver)
		}
		return parametersResolver(parts, path, dataResolver)
	})

	const baseConfig = configSchema(config)
	return {
		config: baseConfig,
		projectConfigResolver: createProjectConfigResolver(env, rawConfig, configProcessors),
		tenantConfigResolver: createTenantConfigResolver(env, rawConfig),
	}
}




