import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { createTenantMutation } from '../../useTenantMutation'

const prepareOtmMutationResult = TenantApi.prepareOtpResponse$$.result(TenantApi.prepareOtpResult$$)

export type PrepareOtpMutationResult = ModelType<typeof TenantApi.prepareOtpResult$$>

export const prepareOtpMutation = TenantApi.mutation$.prepareOtp(
	prepareOtmMutationResult,
	options => options.alias('mutation'),
)


export const usePrepareOtpMutation = createTenantMutation(prepareOtpMutation)
export type PrepareOtpMutationVariables = Parameters<ReturnType<typeof usePrepareOtpMutation>>[0]
