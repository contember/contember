import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation'

export const confirmOtpMutation = TenantApi.mutation$
	.confirmOtp(TenantApi
		.confirmOtpResponse$$
		.error(TenantApi.confirmOtpError$$),
	options => options.alias('mutation'),
	)


export const useConfirmOtpMutation = createTenantMutation(confirmOtpMutation)
export type ConfirmOtpMutationVariables = Parameters<ReturnType<typeof useConfirmOtpMutation>>[0]
