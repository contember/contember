import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { createTenantMutation } from '../../useTenantMutation.js'

const confirmEmailOtpResult = TenantApi.confirmEmailOtpResult$$

export type ConfirmEmailOtpMutationResult = ModelType<typeof confirmEmailOtpResult>

export const confirmEmailOtpMutation = TenantApi.mutation$
	.confirmEmailOtp(
		TenantApi
			.confirmEmailOtpResponse$$
			.error(TenantApi.confirmEmailOtpError$$)
			.result(confirmEmailOtpResult),
		options => options.alias('mutation'),
	)

export const useConfirmEmailOtpMutation = createTenantMutation(confirmEmailOtpMutation)
export type ConfirmEmailOtpMutationVariables = Parameters<ReturnType<typeof useConfirmEmailOtpMutation>>[0]
