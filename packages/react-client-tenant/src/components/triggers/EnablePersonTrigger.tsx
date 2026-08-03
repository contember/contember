import { ReactElement, useCallback } from 'react'
import { TenantActionTrigger } from './TenantActionTrigger.js'
import { EnablePersonMutationVariables, useEnablePersonMutation } from '../../hooks/index.js'

export type EnablePersonTriggerProps =
	& EnablePersonMutationVariables
	& {
		children: ReactElement
		onSuccess?: () => void
		onError?: (e: unknown) => void
	}

export const EnablePersonTrigger = ({ personId, ...props }: EnablePersonTriggerProps) => {
	const enablePerson = useEnablePersonMutation()
	const execute = useCallback(async () => await enablePerson({ personId }), [enablePerson, personId])
	return <TenantActionTrigger {...props} execute={execute} />
}
