import { ReactElement, useCallback } from 'react'
import { TenantActionTrigger } from './TenantActionTrigger.js'
import { ResetPersonMfaMutationVariables, useResetPersonMfaMutation } from '../../hooks/index.js'

export type ResetPersonMfaTriggerProps =
	& ResetPersonMfaMutationVariables
	& {
		children: ReactElement
		onSuccess?: () => void
		onError?: (e: unknown) => void
	}

export const ResetPersonMfaTrigger = ({ personId, ...props }: ResetPersonMfaTriggerProps) => {
	const resetPersonMfa = useResetPersonMfaMutation()
	const execute = useCallback(async () => await resetPersonMfa({ personId }), [personId, resetPersonMfa])
	return <TenantActionTrigger {...props} execute={execute} />
}
