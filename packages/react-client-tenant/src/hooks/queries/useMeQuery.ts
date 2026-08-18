import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi.js'
import { useCallback } from 'react'

const identityFragment = TenantApi
	.identity$$
	// `passwordlessAvailable` / `passwordlessSelfManaged` resolve the tenant policy server-side; the raw
	// `passwordlessEnabled` opt-in alone cannot tell a UI what signing in will actually do.
	.person(
		TenantApi.person$.id.email.name.otpEnabled.emailOtpEnabled.passwordlessEnabled.passwordlessAvailable.passwordlessSelfManaged,
	)
	.projects(
		TenantApi
			.identityProjectRelation$
			.project(TenantApi.project$$.permissions(TenantApi.projectPermissions$$))
			.memberships(TenantApi.membership$$.variables(TenantApi.variableEntry$$)),
	)
	.permissions(TenantApi.identityGlobalPermissions$$)

export type MeQueryData = ModelType<typeof identityFragment>

export const useMeQuery = (options: TenantApiOptions = {}) => {
	const executor = useTenantApi(options)
	return useCallback(async ({}: {}): Promise<MeQueryData> => {
		return (await executor(TenantApi.query$.me(identityFragment))).me
	}, [executor])
}
