import { ReactElement, useCallback } from 'react'
import { TenantActionTrigger } from './TenantActionTrigger.js'
import { ForceSignOutPersonMutationVariables, useForceSignOutPersonMutation } from '../../hooks/index.js'

export type ForceSignOutPersonTriggerProps =
	& ForceSignOutPersonMutationVariables
	& {
		children: ReactElement
		onSuccess?: () => void
		onError?: (e: unknown) => void
	}

export const ForceSignOutPersonTrigger = ({ personId, reason, ...props }: ForceSignOutPersonTriggerProps) => {
	const forceSignOutPerson = useForceSignOutPersonMutation()
	const execute = useCallback(async () => await forceSignOutPerson({ personId, reason }), [forceSignOutPerson, personId, reason])
	return <TenantActionTrigger {...props} execute={execute} />
}
