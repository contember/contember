import { ReactElement, useCallback } from 'react'
import { useDisableOtpMutation } from '../../hooks'
import { TenantActionTrigger } from './TenantActionTrigger'
import { useIdentityMethods } from '../../contexts'

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
			}} {...props}
		/>
	)
}
