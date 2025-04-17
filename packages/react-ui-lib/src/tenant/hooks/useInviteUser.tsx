import * as React from 'react'

import { useInvite } from './useInvite'
import { ToastContent, useShowToast } from '../../toast'
import { useProjectSlug } from '@contember/react-client'
import { EntityAccessor } from '@contember/interface'
import * as TenantApi from '@contember/graphql-client-tenant'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { dict } from '../../dict'

export type InviteUserOptions = {
	/** The name of the field containing the invitee's email address. */
	emailField: string
	/** The name of the field containing the person ID. */
	personIdField: string
	/** An array of memberships to be assigned to the invitee. */
	memberships: TenantApi.MembershipInput[]
}

/**
 * `useInviteUser` is a React hook for managing user invitations within a Contember project.
 * It integrates with the tenant API and project-specific configurations to invite users dynamically
 * based on entity accessor fields.
 *
 * #### Example: Inviting a User
 * ```tsx
 * import { useInviteUser } from './useInviteUser'
 *
 * const InviteUserButton = ({ entityAccessor }: { entityAccessor: EntityAccessor }) => {
 *   const inviteUser = useInviteUser({
 *     emailField: 'email',
 *     personIdField: 'personId',
 *     memberships: [{ role: 'admin', variables: {} }],
 *   })
 *
 *   const handleInvite = async () => {
 *     try {
 *       await inviteUser(() => entityAccessor)
 *       console.log('Invitation sent successfully')
 *     } catch (error) {
 *       console.error('Failed to send invitation:', error)
 *     }
 *   }
 *
 *   return <button onClick={handleInvite}>Invite User</button>
 * };
 * ```
 */
export const useInviteUser = ({ emailField, personIdField, memberships }: InviteUserOptions) => {
	const invite = useInvite()
	const project = useProjectSlug()
	const toast = useShowToast()

	return useReferentiallyStableCallback(async (getAccessor: () => EntityAccessor) => {
		const accessor = getAccessor()
		const personId = accessor.getField<string>(personIdField)
		const email = accessor.getField<string>(emailField)

		if (personId.value || !email.value) {
			return
		}

		const result = await invite({
			email: email.value,
			projectSlug: project!,
			memberships: memberships,
		})

		return () => {
			if (!result?.ok || !result?.result) {
				return toast(<ToastContent title={dict.inviteErrors[result?.error?.code ?? 'fallback']} />, {
					type: 'error',
				})
			}
			personId.updateValue(result.result.person.id)
		}
	},
	)
}
