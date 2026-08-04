import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { createTenantMutation } from '../../useTenantMutation.js'

const signUpMutationResult = TenantApi.signUpResult$
	.person(TenantApi.person$.id.email.name.identity(TenantApi.identity$$))

export type SignUpMutationResult = ModelType<typeof signUpMutationResult>

/**
 * Registers a new person. Whether the resulting account can sign in right away
 * depends on `config.signup.requireEmailVerification`.
 *
 * `error.recommendedAction` tells a UI what to offer on EMAIL_ALREADY_EXISTS,
 * and `weakPasswordReasons` explains a TOO_WEAK rejection — both are worth
 * surfacing rather than collapsing into a generic message.
 */
export const signUpMutation = TenantApi.mutation$
	.signUp(
		TenantApi
			.signUpResponse$$
			.error(TenantApi.signUpError$.code.developerMessage.weakPasswordReasons.recommendedAction)
			.result(signUpMutationResult),
		options => options.alias('mutation'),
	)

export const useSignUpMutation = createTenantMutation(signUpMutation)
export type SignUpMutationVariables = Parameters<ReturnType<typeof useSignUpMutation>>[0]
