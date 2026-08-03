import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation.js'

export const initEmailOtpMutation = TenantApi.mutation$
	.initEmailOtp(
		TenantApi
			.initEmailOtpResponse$$
			.error(TenantApi.initEmailOtpError$$),
		options => options.alias('mutation'),
	)

export const useInitEmailOtpMutation = createTenantMutation(initEmailOtpMutation)
export type InitEmailOtpMutationVariables = Parameters<ReturnType<typeof useInitEmailOtpMutation>>[0]
