import { ReactElement, useCallback } from 'react'
import { useDisableMyPasswordlessMutation } from '../../hooks/index.js'
import { TenantActionTrigger } from './TenantActionTrigger.js'
import { useIdentityMethods } from '../../contexts.js'

export interface DisableMyPasswordlessTriggerProps {
	children: ReactElement
	onSuccess?: () => void
	onError?: (e: unknown) => void
}

export const DisableMyPasswordlessTrigger = ({ onSuccess, ...props }: DisableMyPasswordlessTriggerProps) => {
	const disablePasswordless = useDisableMyPasswordlessMutation()
	const { refreshIdentity } = useIdentityMethods()

	return (
		<TenantActionTrigger
			execute={useCallback(() => disablePasswordless({}), [disablePasswordless])}
			onSuccess={() => {
				refreshIdentity()
				onSuccess?.()
			}}
			{...props}
		/>
	)
}
