import { Project } from '../../../components'
import { useSignInIDP } from '../../mutations'
import { useEffect, useState } from 'react'
import { ContainerSpinner, ErrorList } from '@contember/ui'
import { getBaseHref, IDP_CODE, IDP_SESSION_KEY } from './common'

export interface IDPResponseHandlerProps {
	onLogin: (projects: Project[]) => void,
}

export const IDPResponseHandler = ({ onLogin }: IDPResponseHandlerProps) => {
	const idpSignIn = useSignInIDP()
	const [error, setError] = useState<string>()

	useEffect(() => {
		(async () => {
			let projects: Project[] = []
			const response = await idpSignIn({
				url: window.location.href,
				redirectUrl: getBaseHref(),
				session: JSON.parse(localStorage.getItem(IDP_SESSION_KEY) || '{}'),
				identityProvider: localStorage.getItem(IDP_CODE) ?? '',
				expiration: 3600 * 24 * 14,
			}, {
				onResponse: response => {
					projects = response.extensions?.contemberAdminServer?.projects ?? []
				},
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
				onLogin(projects)
			}
		})()
	}, [idpSignIn, setError, onLogin])

	if (error) {
		return <ErrorList errors={[{ message: error }]} />
	}
	return <ContainerSpinner />
}
