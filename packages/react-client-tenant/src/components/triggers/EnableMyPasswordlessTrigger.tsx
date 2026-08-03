import { ReactElement, useCallback } from 'react'
import { useEnableMyPasswordlessMutation } from '../../hooks/index.js'
import { TenantActionTrigger } from './TenantActionTrigger.js'
import { useIdentityMethods } from '../../contexts.js'

export interface EnableMyPasswordlessTriggerProps {
	children: ReactElement
	onSuccess?: () => void
	onError?: (e: unknown) => void
}

export const EnableMyPasswordlessTrigger = ({ onSuccess, ...props }: EnableMyPasswordlessTriggerProps) => {
	const enablePasswordless = useEnableMyPasswordlessMutation()
	const { refreshIdentity } = useIdentityMethods()

	return (
		<TenantActionTrigger
			execute={useCallback(() => enablePasswordless({}), [enablePasswordless])}
			onSuccess={() => {
				refreshIdentity()
				onSuccess?.()
			}}
			{...props}
		/>
	)
}
