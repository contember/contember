import { useSignInIDP } from '../../mutations'
import { useEffect, useState } from 'react'
import { ContainerSpinner, ErrorList } from '@contember/ui'
import { getBaseHref, IDP_BACKLINK, IDP_CODE, IDP_SESSION_KEY } from './common'
import { useSetSessionToken } from '@contember/react-client'

export interface IDPResponseHandlerProps {
	onLogin?: () => void,
}

export const IDPResponseHandler = ({ onLogin }: IDPResponseHandlerProps) => {
	const idpSignIn = useSignInIDP()
	const [error, setError] = useState<string>()
	const setSessionToken = useSetSessionToken()

	useEffect(() => {
		(async () => {
			const response = await idpSignIn({
				url: window.location.href,
				redirectUrl: getBaseHref(),
				session: JSON.parse(localStorage.getItem(IDP_SESSION_KEY) || '{}'),
				identityProvider: localStorage.getItem(IDP_CODE) ?? '',
				expiration: 3600 * 24 * 14,
			})
			setError(undefined)
			if (!response.ok) {
				window.history.pushState({}, document.title, '/')
				switch (response.error.code) {
					case 'IDP_VALIDATION_FAILED':
					case 'INVALID_IDP_RESPONSE':
						return setError('Login failed')
					case 'PERSON_NOT_FOUND':
						return setError('User not found')
				}
			} else {
				setSessionToken(response.result.token)

				const backlink = localStorage.getItem(IDP_BACKLINK)

				if (backlink !== null) {
					window.history.replaceState({}, document.title, backlink)
				}

				onLogin?.()
			}
		})()
	}, [idpSignIn, setError, onLogin, setSessionToken])

	if (error) {
		return <ErrorList errors={[{ message: error }]} />
	}
	return <ContainerSpinner />
}
