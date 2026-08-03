import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType, ParameterRef } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi.js'
import { useCallback } from 'react'

const authLogPageFragment = TenantApi.authLogPage$
	.entries(TenantApi.authLogEntry$$)
	.hasMore

/** The whole page, not just the entries — `hasMore` drives pagination in the UI. */
export type AuthLogQueryResult = ModelType<typeof authLogPageFragment>

export type AuthLogQueryVariables = { filter?: TenantApi.AuthLogFilter; limit?: number; offset?: number }

export const useAuthLogQuery = (options: TenantApiOptions = {}) => {
	const executor = useTenantApi(options)
	return useCallback(async (variables: AuthLogQueryVariables = {}): Promise<AuthLogQueryResult> => {
		const result = await executor(
			TenantApi.query$.authLog(
				{ filter: ParameterRef.of('filter'), limit: ParameterRef.of('limit'), offset: ParameterRef.of('offset') },
				authLogPageFragment,
			),
			{ variables },
		)

		return result.authLog
	}, [executor])
}
