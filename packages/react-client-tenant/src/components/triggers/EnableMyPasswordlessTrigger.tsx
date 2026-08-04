import { ReactElement, useCallback } from 'react'
import { ToggleMyPasswordlessErrorCode } from '@contember/graphql-client-tenant'
import { useEnableMyPasswordlessMutation } from '../../hooks/index.js'
import { TenantActionErrorArgs, TenantActionTrigger } from './TenantActionTrigger.js'
import { useIdentityMethods } from '../../contexts.js'

export interface EnableMyPasswordlessTriggerProps {
	children: ReactElement
	onSuccess?: () => void
	onError?: (args: TenantActionErrorArgs<ToggleMyPasswordlessErrorCode>) => void
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
