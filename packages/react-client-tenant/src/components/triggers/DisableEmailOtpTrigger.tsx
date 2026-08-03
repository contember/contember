import { ReactElement, useCallback } from 'react'
import { useDisableEmailOtpMutation } from '../../hooks/index.js'
import { TenantActionTrigger } from './TenantActionTrigger.js'
import { useIdentityMethods } from '../../contexts.js'

export interface DisableEmailOtpTriggerProps {
	children: ReactElement
	onSuccess?: () => void
	onError?: (e: unknown) => void
}

export const DisableEmailOtpTrigger = ({ onSuccess, ...props }: DisableEmailOtpTriggerProps) => {
	const disableEmailOtp = useDisableEmailOtpMutation()
	const { refreshIdentity } = useIdentityMethods()

	return (
		<TenantActionTrigger
			execute={useCallback(() => disableEmailOtp({}), [disableEmailOtp])}
			onSuccess={() => {
				refreshIdentity()
				onSuccess?.()
			}}
			{...props}
		/>
	)
}
