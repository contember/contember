import { SyntheticEvent, useCallback, useState } from 'react'
import { ToastContent, useShowToast } from '../ui/toast'
import { StandaloneFormContainer } from '../form'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useSessionTokenWithMeta, useSetSessionToken } from '@contember/react-client'
import * as TenantApi from '@contember/graphql-client-tenant'
import { useTenantApi } from '@contember/react-client-tenant'

export const LoginWithEmail = () => {
	const [email, setEmail] = useState('')
	const sessionToken = useSessionTokenWithMeta()
	const addToast = useShowToast()
	const [isSubmitting, setSubmitting] = useState(false)
	const setSessionToken = useSetSessionToken()
	const api = useTenantApi()

	const submit = useCallback(async (e: SyntheticEvent) => {
		e.preventDefault()

		setSubmitting(true)
		const response = await api(TenantApi.mutation$.createSessionToken(TenantApi.createSessionTokenResponse$$.error(TenantApi.createSessionTokenError$$).result(TenantApi.createSessionTokenResult$$)), {
			variables: {
				email,
				expiration: 3600 * 24 * 7,
			},
			apiToken: sessionToken.propsToken,
		})
		setSubmitting(false)

		if (!response.createSessionToken?.ok) {
			switch (response.createSessionToken?.error?.code) {
				case 'UNKNOWN_EMAIL':
					return addToast(<ToastContent title="Person with given email not found." />, { type: 'error' })
			}
		} else {
			setSessionToken(response.createSessionToken.result!.token)
		}
	}, [addToast, api, email, sessionToken.propsToken, setSessionToken])

	return <>
		<form onSubmit={submit}>
			<div>
				<StandaloneFormContainer label={'E-mail'}>
					<Input value={email} onChange={e => setEmail(e.target.value)} />
				</StandaloneFormContainer>
				<Button type="submit" disabled={isSubmitting}>Login</Button>
			</div>
		</form>
	</>
}
