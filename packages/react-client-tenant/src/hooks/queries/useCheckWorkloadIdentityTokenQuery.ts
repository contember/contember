import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType, ParameterRef } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi.js'
import { useCallback } from 'react'

const tokenCheckFragment = TenantApi.workloadIdentityTokenCheck$$
	.trust(TenantApi.workloadIdentityTrust$$)
	.failure(TenantApi.workloadIdentityTokenCheckFailure$$)

export type CheckWorkloadIdentityTokenQueryResult = ModelType<typeof tokenCheckFragment>

export type CheckWorkloadIdentityTokenQueryVariables = {
	token: string
}

/**
 * Runs the workload token verification without DPoP and reports the first failing step.
 *
 * Requires `workloadIdentity:list`. The token is a live credential: the server neither stores nor
 * logs it, and a caller must not either — keep it out of URLs, storage and error logging.
 */
export const useCheckWorkloadIdentityTokenQuery = (options: TenantApiOptions = {}) => {
	const executor = useTenantApi(options)
	return useCallback(async ({ token }: CheckWorkloadIdentityTokenQueryVariables): Promise<CheckWorkloadIdentityTokenQueryResult> => {
		const result = await executor(
			TenantApi.query$.checkWorkloadIdentityToken({ token: ParameterRef.of('token') }, tokenCheckFragment),
			{ variables: { token } },
		)

		return result.checkWorkloadIdentityToken
	}, [executor])
}
