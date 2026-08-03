import { ReactElement, useCallback } from 'react'
import { TenantActionTrigger } from './TenantActionTrigger.js'
import { DisablePersonMutationVariables, useDisablePersonMutation } from '../../hooks/index.js'

export type DisablePersonTriggerProps =
	& DisablePersonMutationVariables
	& {
		children: ReactElement
		onSuccess?: () => void
		onError?: (e: unknown) => void
	}

export const DisablePersonTrigger = ({ personId, ...props }: DisablePersonTriggerProps) => {
	const disablePerson = useDisablePersonMutation()
	const execute = useCallback(async () => await disablePerson({ personId }), [disablePerson, personId])
	return <TenantActionTrigger {...props} execute={execute} />
}
