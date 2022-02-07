import { ProjectConfig, ProjectSecrets } from '@contember/engine-http'
import { ConfigProcessor } from '@contember/engine-plugins'
import { Merger, ParametersResolver, resolveParameters, UndefinedParameterError } from '@contember/config-loader'
import { Typesafe } from '@contember/engine-common'
import { projectConfigSchema } from './configSchema'

export type ProjectConfigResolver = (
	slug: string,
	additionalConfig: any,
	secrets: ProjectSecrets,
) => ProjectConfig

type Env = Record<string, string>

export const createProjectConfigResolver = (env: Env, config: any, configProcessors: ConfigProcessor[]): ProjectConfigResolver =>
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

const projectNameToEnvName = (projectName: string): string => {
	const envName = projectName.toUpperCase().replace(/-/g, '_')
	if (envName === 'TENANT') {
		throw new Error('Forbidden project name')
	}
	return envName
}
