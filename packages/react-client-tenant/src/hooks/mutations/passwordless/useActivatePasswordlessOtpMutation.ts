import * as TenantApi from '@contember/graphql-client-tenant'
import { LoginToken } from '../../useTenantApi'
import { createTenantMutation } from '../../useTenantMutation'


const ActivatePasswordlessOtpMutation = TenantApi
	.mutation$
	.activatePasswordlessOtp(
		TenantApi
			.activatePasswordlessOtpResponse$$
			.error(TenantApi.activatePasswordlessOtpError$$),
		options => options.alias('mutation'),
	)

export const useActivatePasswordlessOtpMutation = createTenantMutation(ActivatePasswordlessOtpMutation, {
	apiToken: LoginToken,
})

export type ActivatePasswordlessOtpMutationVariables = Parameters<ReturnType<typeof useActivatePasswordlessOtpMutation>>[0]
