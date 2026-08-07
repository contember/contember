import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi.js'
import { useCallback } from 'react'

const identityProviderFragment = TenantApi.identityProvider$$
	.options(TenantApi.iDPOptionsOutput$$)

export type IdentityProvidersQueryResult = readonly ModelType<typeof identityProviderFragment>[]

/**
 * Lists the identity providers configured on the tenant.
 *
 * Requires `idp:list` (PROJECT_ADMIN / SUPER_ADMIN), so this is an
 * administration view — it cannot be used to render provider buttons on a login
 * screen, where the caller is unauthenticated. Those slugs still come from the
 * application's own configuration.
 *
 * `configuration` is passed through `IdentityProviderHandler.getPublicConfiguration`
 * server-side, which strips the client secret for the built-in oidc / apple /
 * facebook handlers. A third-party handler that does not implement it returns
 * the raw stored configuration, so do not render this blob unconditionally.
 */
export const useIdentityProvidersQuery = (options: TenantApiOptions = {}) => {
	const executor = useTenantApi(options)
	return useCallback(async ({}: {} = {}): Promise<IdentityProvidersQueryResult> => {
		const result = await executor(TenantApi.query$.identityProviders(identityProviderFragment), {})

		return result.identityProviders
	}, [executor])
}
