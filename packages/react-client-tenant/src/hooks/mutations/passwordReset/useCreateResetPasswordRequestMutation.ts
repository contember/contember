import * as TenantApi from '@contember/graphql-client-tenant'
import { LoginToken } from '../../useTenantApi'
import { createTenantMutation } from '../../useTenantMutation'

export const createResetPasswordRequestMutation = TenantApi
	.mutation$
	.createResetPasswordRequest(
		TenantApi
			.createPasswordResetRequestResponse$$
			.error(TenantApi.createPasswordResetRequestError$$),
		options => options.alias('mutation'),
	)

export const useCreateResetPasswordRequestMutation = createTenantMutation(createResetPasswordRequestMutation, {
	apiToken: LoginToken,
})
export type CreateResetPasswordRequestMutationVariables = Parameters<ReturnType<typeof useCreateResetPasswordRequestMutation>>[0]
