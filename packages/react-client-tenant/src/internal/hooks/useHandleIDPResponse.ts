import { SetStateAction, useEffect, useRef } from 'react'
import { useSetSessionToken } from '@contember/react-client'
import { useIDPStateStore } from './useIDPStateStore'
import { getBaseHref } from '../utils/getBaseHref'
import { IDPStateValue } from '../../types/idp'
import { useSignInIDPMutation } from '../../hooks'
import { useRedirectToBacklinkCallback } from './useRedirectToBacklink'

export interface UseHandleIDPResponseProps {
	onLogin?: () => void
	expiration?: number

	setState: (state: SetStateAction<IDPStateValue>) => void
	hasOauthResponse: boolean
	redirectUrl?: string
}

const headers = {
	'X-Contember-Token-Path': 'data.mutation.result.token',
}

const DEFAULT_LOGIN_EXPIRATION = 14 * 24 * 60 // 14 days

export const useHandleIDPResponse = ({ onLogin, expiration = DEFAULT_LOGIN_EXPIRATION, setState, hasOauthResponse, redirectUrl }: UseHandleIDPResponseProps): void => {
	const idpSignIn = useSignInIDPMutation({ headers })
	const setSessionToken = useSetSessionToken()

	const firstRenderRef = useRef(true)

	const { get: loadIdpState } = useIDPStateStore()
	const redirectToBackLink = useRedirectToBacklinkCallback()

	useEffect(() => {
		if (!hasOauthResponse || !firstRenderRef.current) {
			return
		}
		firstRenderRef.current = false
		;(async () => {
			const idpState = loadIdpState()
			if (!idpState) {
				setState({ type: 'response_failed', error: 'INVALID_LOCAL_STATE' })
				return
			}

			const response = await idpSignIn({
				data: {
					url: window.location.href,
					redirectUrl: redirectUrl || getBaseHref(),
					sessionData: idpState.sessionData,
				},
				identityProvider: idpState.provider,
				expiration,
			})
			if (!response.ok) {
				setState({ type: 'response_failed', error: response.error || 'UNKNOWN_ERROR' })
			} else {
				setSessionToken(response.result.token)
				setState({ type: 'success' })

				onLogin?.()
				redirectToBackLink()
			}
		})()
	}, [idpSignIn, onLogin, setSessionToken, hasOauthResponse, loadIdpState, expiration, setState, redirectToBackLink])
}
