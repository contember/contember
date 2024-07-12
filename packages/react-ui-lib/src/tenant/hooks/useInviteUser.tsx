import * as React from 'react'

import { useInvite } from './useInvite'
import { ToastContent, useShowToast } from '../../toast'
import { useProjectSlug } from '@contember/react-client'
import { EntityAccessor } from '@contember/interface'
import * as TenantApi from '@contember/graphql-client-tenant'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { dict } from '../../dict'

export const useInviteUser = ({ emailField, personIdField, memberships }: {
	personIdField: string
	emailField: string
	memberships: TenantApi.MembershipInput[]
}) => {
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
