import { ReactElement, useCallback } from 'react'
import { DisableOtpErrorCode } from '@contember/graphql-client-tenant'
import { useDisableOtpMutation } from '../../hooks/index.js'
import { TenantActionErrorArgs, TenantActionTrigger } from './TenantActionTrigger.js'
import { useIdentityMethods } from '../../contexts.js'

export interface DisableOtpTriggerProps {
	children: ReactElement
	onSuccess?: () => void
	onError?: (args: TenantActionErrorArgs<DisableOtpErrorCode>) => void
}

export const DisableOtpTrigger = ({ onSuccess, ...props }: DisableOtpTriggerProps) => {
	const disableOtp = useDisableOtpMutation()
	const { refreshIdentity } = useIdentityMethods()

	return (
		<TenantActionTrigger
			execute={useCallback(() => disableOtp({}), [disableOtp])}
			onSuccess={() => {
				refreshIdentity()
				onSuccess?.()
			}}
			{...props}
		/>
	)
}
