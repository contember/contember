import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi.js'
import { useCallback } from 'react'

const authPolicyFragment = TenantApi.authPolicy$$

export type AuthPoliciesQueryResult = readonly ModelType<typeof authPolicyFragment>[]

/**
 * Lists the configured per-role MFA / session policies.
 *
 * Read-only on purpose — policies are written with `contember tenant:apply`.
 * Requires `system:configure`; the resolver **throws** for a caller without it.
 *
 * Note that policies aggregate rather than override: an identity is subject to
 * every policy matching any of its roles, strictest wins.
 */
export const useAuthPoliciesQuery = (options: TenantApiOptions = {}) => {
	const executor = useTenantApi(options)
	return useCallback(async ({}: {} = {}): Promise<AuthPoliciesQueryResult> => {
		const result = await executor(TenantApi.query$.authPolicies(authPolicyFragment), {})

		return result.authPolicies
	}, [executor])
}
