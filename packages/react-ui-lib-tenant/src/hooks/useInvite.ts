import * as TenantApi from '@contember/graphql-client-tenant'
import { useTenantApi } from '@contember/react-client-tenant'
import { useCallback } from 'react'

const InviteFetcher = TenantApi.inviteResponse$$
	.error(TenantApi.inviteError$$)
	.result(TenantApi.inviteResult$$.person(TenantApi.person$.id.email.name.identity(TenantApi.identity$$)))

export type InviteErrorCodes = TenantApi.InviteErrorCode

export const useInvite = () => {
	const api = useTenantApi()

	return useCallback(async (variables: {
		email: string
		projectSlug: string
		memberships: TenantApi.MembershipInput[]
	}) => {
		return (await api(TenantApi.mutation$.invite(InviteFetcher), {
			variables: {
				options: {
					method: 'RESET_PASSWORD',
				},
				...variables,
			},
		})).invite
	}, [api])
}
