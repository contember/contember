import { useEffect, useState } from 'react'
import { PASSWORDLESS_REQUEST_STORAGE_KEY } from '../consts'
import { useActivatePasswordlessOtpMutation } from './mutations'
import { randomString } from '../internal/utils/randomInt'
import { calculateHash } from '../internal/utils/hashing'
import { ActivatePasswordlessOtpErrorCode } from '@contember/graphql-client-tenant'

const usePasswordlessParams = (): {localStorageRequestId: string | null; urlRequestId: string | null; urlToken: string | null} => {
	const localStorageValue = localStorage.getItem(PASSWORDLESS_REQUEST_STORAGE_KEY) ?? null
	const urlParams = new URLSearchParams(window.location.search)
	const requestId = urlParams.get('request_id')
	const token = urlParams.get('token')

	return { localStorageRequestId: localStorageValue, urlRequestId: requestId, urlToken: token }
}

export type PasswordlessResponseHandlerState =
	| { type: 'empty' }
	| { type: 'otp_activating' }
	| { type: 'otp_activated'; otp: string }
	| { type: 'otp_activation_failed'; error: ActivatePasswordlessOtpErrorCode | 'UNKNOWN_ERROR'}
	| { type: 'can_proceed_to_login' }

export const usePasswordlessOtpActivator = ({ otpLength = 6, otpChars = '0123456789ABCDEF' }: {
	otpLength?: number
	otpChars?: string
} = {}) => {
	const { localStorageRequestId, urlRequestId, urlToken } = usePasswordlessParams()
	const activateOtp = useActivatePasswordlessOtpMutation()

	const [state, setState] = useState<PasswordlessResponseHandlerState>(() => {
		if (urlRequestId && urlToken) {
			if (localStorageRequestId !== urlRequestId) {
				return { type: 'otp_activating' }
			} else {
				return { type: 'can_proceed_to_login' }
			}
		}
		return { type: 'empty' }
	})

	useEffect(() => {
		(async () => {
			if (state.type === 'otp_activating') {
				const otpCode = randomString(otpLength, otpChars)
				try {
					const result = await activateOtp({
						requestId: urlRequestId!,
						token: urlToken!,
						otpHash: await calculateHash('SHA-256', otpCode),
					})
					if (!result.ok) {
						setState({ type: 'otp_activation_failed', error: result.error })
					} else {
						setState({ type: 'otp_activated', otp: otpCode })
					}
				} catch (e) {
					console.error(e)
					setState({ type: 'otp_activation_failed', error: 'UNKNOWN_ERROR' })
				}
			}
		})()
	}, [activateOtp, localStorageRequestId, otpChars, otpLength, state.type, urlRequestId, urlToken])

	return state
}
