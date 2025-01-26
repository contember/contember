import * as TenantApi from '@contember/graphql-client-tenant'
import { useTenantApi } from '@contember/react-client-tenant'
import { useCallback } from 'react'

const InviteFetcher = TenantApi.inviteResponse$$
	.error(TenantApi.inviteError$$)
	.result(TenantApi.inviteResult$$.person(TenantApi.person$.id.email.name.identity(TenantApi.identity$$)))

export type InviteErrorCodes = TenantApi.InviteErrorCode

/**
 * `useInvite` is a React hook for managing user invitations in a Contember project.
 * It interacts with the tenant API to send an invitation with specific memberships and project details.
 *
 * #### Features
 * - Sends invitations to users via the tenant API.
 * - Supports specifying project membership details.
 * - Automatically includes options for password reset during the invitation process.
 *
 * #### Returns
 * A callback function that accepts an object with the following properties:
 * - `email` (string): The email address of the invitee.
 * - `projectSlug` (string): The slug of the project the user is being invited to.
 * - `memberships` (TenantApi.MembershipInput[]): An array defining the memberships to be assigned.
 *
 * #### Example: Sending an Invitation
 * ```tsx
 * import { useInvite } from './useInvite'
 *
 * const InviteUser = () => {
 *   const invite = useInvite()
 *
 *   const handleInvite = async () => {
 *     try {
 *       const response = await invite({
 *         email: 'user@example.com',
 *         projectSlug: 'my-project',
 *         memberships: [
 *           { role: 'editor', variables: {} },
 *         ],
 *       });
 *       console.log('Invitation sent:', response)
 *     } catch (error) {
 *       console.error('Failed to send invitation:', error)
 *     }
 *   };
 *
 *   return <button onClick={handleInvite}>Send Invite</button>
 * };
 * ```
 */
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
