import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { createTenantMutation } from '../../useTenantMutation'

const inviteMutationResult = TenantApi.inviteResult$$
	.person(TenantApi.person$.id.email.name.identity(TenantApi.identity$$))

export type InviteMutationResult = ModelType<typeof inviteMutationResult>

export const inviteMutation = TenantApi.mutation$
	.invite(
		TenantApi
			.inviteResponse$$
			.error(TenantApi.inviteError$$.membershipValidation(TenantApi.membershipValidationError$$))
			.result(inviteMutationResult),
		options => options.alias('mutation'),
	)

export const useInviteMutation = createTenantMutation(inviteMutation)
export type InviteMutationVariables = Parameters<ReturnType<typeof useInviteMutation>>[0]
