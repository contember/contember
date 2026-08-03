import { ReactElement, useCallback } from 'react'
import { useInitEmailOtpMutation } from '../../hooks/index.js'
import { TenantActionTrigger } from './TenantActionTrigger.js'

export interface InitEmailOtpTriggerProps {
	children: ReactElement
	onSuccess?: () => void
	onError?: (e: unknown) => void
}

// No identity refresh — this only mails the code, nothing about the identity changed yet.
export const InitEmailOtpTrigger = (props: InitEmailOtpTriggerProps) => {
	const initEmailOtp = useInitEmailOtpMutation()

	return <TenantActionTrigger execute={useCallback(() => initEmailOtp({}), [initEmailOtp])} {...props} />
}
