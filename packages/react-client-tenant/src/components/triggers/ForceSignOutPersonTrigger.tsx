import { ReactElement, useCallback } from 'react'
import { ForceSignOutPersonErrorCode } from '@contember/graphql-client-tenant'
import { TenantActionErrorArgs, TenantActionTrigger } from './TenantActionTrigger.js'
import { ForceSignOutPersonMutationVariables, useForceSignOutPersonMutation } from '../../hooks/index.js'

export type ForceSignOutPersonTriggerProps =
	& ForceSignOutPersonMutationVariables
	& {
		children: ReactElement
		onSuccess?: () => void
		onError?: (args: TenantActionErrorArgs<ForceSignOutPersonErrorCode>) => void
	}

export const ForceSignOutPersonTrigger = ({ personId, reason, ...props }: ForceSignOutPersonTriggerProps) => {
	const forceSignOutPerson = useForceSignOutPersonMutation()
	const execute = useCallback(async () => await forceSignOutPerson({ personId, reason }), [forceSignOutPerson, personId, reason])
	return <TenantActionTrigger {...props} execute={execute} />
}
