import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi.js'
import { useCallback } from 'react'

const workloadIdentityTrustFragment = TenantApi.workloadIdentityTrust$$
	.memberships(TenantApi.workloadIdentityTrustMembership$$.variables(TenantApi.variableEntry$$))

export type WorkloadIdentityTrustsQueryResult = readonly ModelType<typeof workloadIdentityTrustFragment>[]

/**
 * Lists the workload identity trusts configured on the tenant, enabled and disabled.
 *
 * Requires `workloadIdentity:list` and throws a `ForbiddenError` without it, like the other
 * configuration queries. Trusts are written with `contember tenant:apply`.
 */
export const useWorkloadIdentityTrustsQuery = (options: TenantApiOptions = {}) => {
	const executor = useTenantApi(options)
	return useCallback(async ({}: {} = {}): Promise<WorkloadIdentityTrustsQueryResult> => {
		const result = await executor(TenantApi.query$.workloadIdentityTrusts(workloadIdentityTrustFragment), {})

		return result.workloadIdentityTrusts
	}, [executor])
}
