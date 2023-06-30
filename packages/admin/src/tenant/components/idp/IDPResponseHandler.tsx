import { useCallback } from 'react'
import { ErrorList, SpinnerOverlay } from '@contember/ui'
import { useHandleIDPResponse } from './useHandleIDPResponse'

export interface IDPResponseHandlerProps {
	onLogin?: () => void,
}

export const useResponseHandlerFeedback = ({ onLogin }: IDPResponseHandlerProps) => {
	const responseState = useHandleIDPResponse({
		onLogin,
		onError: useCallback(() => {
			window.history.pushState({}, document.title, '/')
		}, []),
	})

	switch (responseState.type) {
		case 'nothing':
			return null

		case 'failed':
			const error = {
				INVALID_IDP_RESPONSE: 'Login failed',
				IDP_VALIDATION_FAILED: 'Login failed',
				INVALID_LOCAL_STATE: 'Login failed',
				PERSON_NOT_FOUND: 'User not found',
			}[responseState.error]

			return <ErrorList errors={[{ message: error }]} />

		default:
			return <SpinnerOverlay />
	}
}

export const IDPResponseHandler = ({ onLogin }: IDPResponseHandlerProps) => {
	return useResponseHandlerFeedback({ onLogin })
}
