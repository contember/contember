import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation.js'

export const disableEmailOtpMutation = TenantApi.mutation$
	.disableEmailOtp(
		TenantApi
			.disableEmailOtpResponse$$
			.error(TenantApi.disableEmailOtpError$$),
		options => options.alias('mutation'),
	)

export const useDisableEmailOtpMutation = createTenantMutation(disableEmailOtpMutation)
export type DisableEmailOtpMutationVariables = Parameters<ReturnType<typeof useDisableEmailOtpMutation>>[0]
