import { ReactElement, useCallback } from 'react'
import { useDisableOtpMutation } from '../../hooks/index.js'
import { TenantActionTrigger } from './TenantActionTrigger.js'
import { useIdentityMethods } from '../../contexts.js'

export interface DisableOtpTriggerProps {
	children: ReactElement
	onSuccess?: () => void
	onError?: (e: unknown) => void
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
