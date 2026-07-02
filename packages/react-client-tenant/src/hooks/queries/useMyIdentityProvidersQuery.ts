import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi.js'
import { useCallback } from 'react'

const personIdentityProviderFragment = TenantApi
	.personIdentityProvider$$
	.identityProvider(TenantApi.identityProviderListItem$$)

export type MyIdentityProvidersQueryResult = readonly ModelType<typeof personIdentityProviderFragment>[]

export const useMyIdentityProvidersQuery = (options: TenantApiOptions = {}) => {
	const executor = useTenantApi(options)
	return useCallback(async ({}: {} = {}): Promise<MyIdentityProvidersQueryResult> => {
		const result = await executor(
			TenantApi.query$.me(
				TenantApi.identity$.person(
					TenantApi.person$.identityProviders(personIdentityProviderFragment),
				),
			),
		)

		return result.me.person?.identityProviders ?? []
	}, [executor])
}
