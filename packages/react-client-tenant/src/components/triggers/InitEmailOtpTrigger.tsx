import { ReactElement, useCallback } from 'react'
import { InitEmailOtpErrorCode } from '@contember/graphql-client-tenant'
import { useInitEmailOtpMutation } from '../../hooks/index.js'
import { TenantActionErrorArgs, TenantActionTrigger } from './TenantActionTrigger.js'

export interface InitEmailOtpTriggerProps {
	children: ReactElement
	onSuccess?: () => void
	onError?: (args: TenantActionErrorArgs<InitEmailOtpErrorCode>) => void
}

// No identity refresh — this only mails the code, nothing about the identity changed yet.
export const InitEmailOtpTrigger = (props: InitEmailOtpTriggerProps) => {
	const initEmailOtp = useInitEmailOtpMutation()

	return <TenantActionTrigger execute={useCallback(() => initEmailOtp({}), [initEmailOtp])} {...props} />
}
