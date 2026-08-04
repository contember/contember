import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi.js'
import { useCallback } from 'react'

const rateLimitsFragment = TenantApi.configRateLimits$
	.signUpPerIp(TenantApi.configRateLimitWindow$$)
	.loginPerIp(TenantApi.configRateLimitWindow$$)
	.passwordResetPerIp(TenantApi.configRateLimitWindow$$)
	.passwordlessInitPerIp(TenantApi.configRateLimitWindow$$)
	.emailOtpPerPerson(TenantApi.configRateLimitWindow$$)
	.emailVerificationPerIp(TenantApi.configRateLimitWindow$$)

const configFragment = TenantApi.config$
	.signup(TenantApi.configSignup$$)
	.emailChange(TenantApi.configEmailChange$$)
	.passwordless(TenantApi.configPasswordless$$)
	.password(TenantApi.configPassword$$)
	.login(TenantApi.configLogin$$.anomalyDetection(TenantApi.configLoginAnomalyDetection$$))
	.captcha(TenantApi.configCaptcha$$.protect(TenantApi.configCaptchaProtect$$))
	.rateLimits(rateLimitsFragment)

export type ConfigurationQueryResult = ModelType<typeof configFragment>

/**
 * Reads the tenant-wide configuration. Read-only on purpose — the write path is
 * `contember tenant:apply`, there is no `useConfigureMutation`.
 *
 * Requires `system:configure`; the resolver **throws** for a caller without it
 * rather than returning a default, so consumers must treat the rejection as a
 * normal "not visible to you" state.
 */
export const useConfigurationQuery = (options: TenantApiOptions = {}) => {
	const executor = useTenantApi(options)
	return useCallback(async ({}: {} = {}): Promise<ConfigurationQueryResult> => {
		const result = await executor(TenantApi.query$.configuration(configFragment), {})

		return result.configuration
	}, [executor])
}
