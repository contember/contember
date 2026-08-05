import { ReactElement, useCallback } from 'react'
import { DisablePersonErrorCode } from '@contember/graphql-client-tenant'
import { TenantActionErrorArgs, TenantActionTrigger } from './TenantActionTrigger.js'
import { DisablePersonMutationVariables, useDisablePersonMutation } from '../../hooks/index.js'

export type DisablePersonTriggerProps =
	& DisablePersonMutationVariables
	& {
		children: ReactElement
		onSuccess?: () => void
		onError?: (args: TenantActionErrorArgs<DisablePersonErrorCode>) => void
	}

export const DisablePersonTrigger = ({ personId, ...props }: DisablePersonTriggerProps) => {
	const disablePerson = useDisablePersonMutation()
	const execute = useCallback(async () => await disablePerson({ personId }), [disablePerson, personId])
	return <TenantActionTrigger {...props} execute={execute} />
}
