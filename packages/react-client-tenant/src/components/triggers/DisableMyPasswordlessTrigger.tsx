import { ReactElement, useCallback } from 'react'
import { ToggleMyPasswordlessErrorCode } from '@contember/graphql-client-tenant'
import { useDisableMyPasswordlessMutation } from '../../hooks/index.js'
import { TenantActionErrorArgs, TenantActionTrigger } from './TenantActionTrigger.js'
import { useIdentityMethods } from '../../contexts.js'

export interface DisableMyPasswordlessTriggerProps {
	children: ReactElement
	onSuccess?: () => void
	onError?: (args: TenantActionErrorArgs<ToggleMyPasswordlessErrorCode>) => void
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
