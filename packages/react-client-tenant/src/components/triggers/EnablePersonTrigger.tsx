import { ReactElement, useCallback } from 'react'
import { EnablePersonErrorCode } from '@contember/graphql-client-tenant'
import { TenantActionErrorArgs, TenantActionTrigger } from './TenantActionTrigger.js'
import { EnablePersonMutationVariables, useEnablePersonMutation } from '../../hooks/index.js'

export type EnablePersonTriggerProps =
	& EnablePersonMutationVariables
	& {
		children: ReactElement
		onSuccess?: () => void
		onError?: (args: TenantActionErrorArgs<EnablePersonErrorCode>) => void
	}

export const EnablePersonTrigger = ({ personId, ...props }: EnablePersonTriggerProps) => {
	const enablePerson = useEnablePersonMutation()
	const execute = useCallback(async () => await enablePerson({ personId }), [enablePerson, personId])
	return <TenantActionTrigger {...props} execute={execute} />
}
