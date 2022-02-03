import {
	ConfigLoader,
	createObjectParametersResolver,
	Merger,
	ParametersResolver,
	resolveParameters,
	UndefinedParameterError,
} from '@contember/config-loader'
import { ConfigProcessor } from '@contember/engine-plugins'
import { Typesafe } from '@contember/engine-common'
import { ProjectConfigResolver, ProjectSecrets } from '@contember/engine-http'
import { configSchema, projectConfigSchema } from './configSchema'
import { configTemplate } from './configTemplate'

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
	config = resolveParameters(config, createTenantParametersResolver(env, parametersResolver))

	const baseConfig = configSchema(config)
	return {
		config: baseConfig,
		projectConfigResolver: createProjectConfigResolver(env, rawConfig, configProcessors),
	}
}

const projectNameToEnvName = (projectName: string): string => {
	const envName = projectName.toUpperCase().replace(/-/g, '_')
	if (envName === 'TENANT') {
		throw new Error('Forbidden project name')
	}
	return envName
}

const createTenantParametersResolver =  (env: Env, next: ParametersResolver): ParametersResolver =>
	(parts, path, dataResolver) => {
		if (parts[0] === 'tenant') {
			if (path[0] !== 'tenant') {
				throw new Error(`Invalid use of ${parts.join('.')} variable in path ${path.join('.')}.`)
			}
			if (parts[1] === 'env') {
				const envName = parts[2]
				const envValue = env['TENANT_' + envName] || env['DEFAULT_' + envName]
				if (envValue === undefined) {
					throw new UndefinedParameterError(`ENV variable "${'TENANT_' + envName}" not found.`)
				}
				return envValue
			}
			throw new UndefinedParameterError(`Parameter "${parts.join('.')}" not found.`)
		}
		return next(parts, path, dataResolver)
	}

const createProjectConfigResolver = (env: Env, config: any, configProcessors: ConfigProcessor[]): ProjectConfigResolver =>
	(slug, additionalConfig, secrets) => {
		const mergedConfig = Merger.merge(
			config.projectDefaults as any,
			(config?.projects as any)?.[slug] as any,
			additionalConfig,
		)
		if (!mergedConfig.stages) {
			mergedConfig.stages = { live: {} }
		}
		const resolvedConfig = resolveParameters(mergedConfig, createProjectParametersResolver(slug, env, secrets))

		const projectConfigSchemaWithPlugins = configProcessors.reduce(
			(schema, current) => (
				current.getProjectConfigSchema ? Typesafe.intersection(schema, current.getProjectConfigSchema(slug)) : schema
			),
			projectConfigSchema,
		)
		return projectConfigSchemaWithPlugins(resolvedConfig, ['project', slug])
	}

const createProjectParametersResolver = (slug: string, env: Env, secrets: ProjectSecrets): ParametersResolver =>
	parts => {
		if (parts[0] === 'project') {
			if (parts[1] === 'env') {
				const envName = parts[2]
				const projectEnvName = projectNameToEnvName(slug)
				const envValue = env[projectEnvName + '_' + envName] || env['DEFAULT_' + envName]
				if (envValue === undefined) {
					throw new UndefinedParameterError(`ENV variable "${projectEnvName + '_' + envName}" not found.`)
				}
				return envValue
			} else if (parts[1] === 'slug') {
				return slug
			} else if (parts[1] === 'secret') {
				const key = parts.slice(2).join('.')
				const value = secrets[key]
				if (value === undefined) {
					throw new UndefinedParameterError(`Project secret ${parts[2]} not found`)
				}
				return value
			}
		}
		throw new UndefinedParameterError(`Parameter "${parts.join('.')}" not found.`)
	}
