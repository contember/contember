import { TenantConfig } from './config'
import {
	createObjectParametersResolver,
	Merger,
	ParametersResolver,
	resolveParameters,
	UndefinedParameterError,
} from '@contember/config-loader'
import { tenantConfigSchema } from './configSchema'

export type TenantConfigResolver =  (slug: string | undefined, additionalConfig: any) => TenantConfig

type Env = Record<string, string>

export const createTenantConfigResolver = (env: Env, tenantConfig: any): TenantConfigResolver =>
	(slug, additionalConfig) => {
		const mergedConfig = Merger.merge(tenantConfig, additionalConfig)
		const parametersResolver = createObjectParametersResolver({ env })
		const tenantParametersResolver = createTenantParametersResolver(env)
		const resolvedConfig = resolveParameters(mergedConfig, (parts, path, dataResolver) => {
			if (parts[0] === 'tenant') {
				return tenantParametersResolver(parts, path, dataResolver)
			}
			return parametersResolver(parts, path, dataResolver)
		})
		return tenantConfigSchema(resolvedConfig)
	}


export const createTenantParametersResolver = (env: Env): ParametersResolver =>
	parts => {
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
