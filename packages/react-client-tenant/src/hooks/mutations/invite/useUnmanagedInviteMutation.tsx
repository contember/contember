import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { createTenantMutation } from '../../useTenantMutation.js'

const unmanagedInviteMutationResult = TenantApi.inviteResult$$
	.person(TenantApi.person$.id.email.name.identity(TenantApi.identity$$))

export type UnmanagedInviteMutationResult = ModelType<typeof unmanagedInviteMutationResult>

/**
 * Creates a member without sending an invitation e-mail, optionally with a
 * password set up front. Seeding, migrations and air-gapped environments need
 * this; `invite` always mails.
 */
export const unmanagedInviteMutation = TenantApi.mutation$
	.unmanagedInvite(
		TenantApi
			.inviteResponse$$
			.error(TenantApi.inviteError$$.membershipValidation(TenantApi.membershipValidationError$$))
			.result(unmanagedInviteMutationResult),
		options => options.alias('mutation'),
	)

export const useUnmanagedInviteMutation = createTenantMutation(unmanagedInviteMutation)
export type UnmanagedInviteMutationVariables = Parameters<ReturnType<typeof useUnmanagedInviteMutation>>[0]
