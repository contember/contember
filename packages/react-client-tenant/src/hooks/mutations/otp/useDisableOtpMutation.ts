import * as TenantApi from '@contember/graphql-client-tenant'
import { createTenantMutation } from '../../useTenantMutation'

export const disableOtpMutation = TenantApi.mutation$.disableOtp(
	TenantApi.disableOtpResponse$$.error(TenantApi.disableOtpError$$),
	options => options.alias('mutation'),
)

export const useDisableOtpMutation = createTenantMutation(disableOtpMutation)
export type DisableOtpMutationVariables = Parameters<ReturnType<typeof useDisableOtpMutation>>[0]
