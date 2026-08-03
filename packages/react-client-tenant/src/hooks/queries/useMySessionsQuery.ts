import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi.js'
import { useCallback } from 'react'

const sessionFragment = TenantApi.sessionInfo$$

export type MySessionsQueryResult = readonly ModelType<typeof sessionFragment>[]

export const useMySessionsQuery = (options: TenantApiOptions = {}) => {
	const executor = useTenantApi(options)
	return useCallback(async ({}: {} = {}): Promise<MySessionsQueryResult> => {
		const result = await executor(
			TenantApi.query$.me(TenantApi.identity$.sessions(sessionFragment)),
		)

		return result.me.sessions
	}, [executor])
}
