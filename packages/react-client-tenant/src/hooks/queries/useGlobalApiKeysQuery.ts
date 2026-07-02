import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi.js'
import { useCallback } from 'react'

const globalApiKeyFragment = TenantApi
	.apiKey$$
	.identity(TenantApi.identity$$)

export type GlobalApiKeysQueryResult = readonly ModelType<typeof globalApiKeyFragment>[]

export const useGlobalApiKeysQuery = (options: TenantApiOptions = {}) => {
	const executor = useTenantApi(options)
	return useCallback(async ({}: {} = {}): Promise<GlobalApiKeysQueryResult> => {
		const result = await executor(TenantApi.query$.globalApiKeys(globalApiKeyFragment))

		return result.globalApiKeys ?? []
	}, [executor])
}
