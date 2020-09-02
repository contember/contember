import { getTenantErrorMessage } from '@contember/client'
import { Button, ErrorList, FormGroup, TextInput } from '@contember/ui'
import * as React from 'react'
import { useDispatch } from 'react-redux'
import { createAction } from 'redux-actions'
import { ApiRequestReadyState, useLoginRequest } from '@contember/react-client'
import { SET_IDENTITY } from '../../reducer/auth'
import { AuthIdentity, Project } from '../../state/auth'
import { MiscPageLayout } from '../MiscPageLayout'
import { useRedirect } from '../pageRouting'

export const Login = React.memo(() => {
	const [requestState, login] = useLoginRequest()
	const [email, setEmail] = React.useState('')
	const [password, setPassword] = React.useState('')

	const isLoading = requestState.readyState === ApiRequestReadyState.Pending

	const onSubmit = React.useCallback(
		(e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault()
			login(email, password)
		},
		[email, login, password],
	)
	const onEmailChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value), [])
	const onPasswordChange = React.useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
		[],
	)

	const errorMessages = React.useMemo(() => {
		let errors: string[] = []

		if (requestState.readyState === ApiRequestReadyState.Error) {
			errors.push('Something went wrong. Please try again.')
		} else if (requestState.readyState === ApiRequestReadyState.Success) {
			errors = errors.concat(
				requestState.data.data.signIn.errors.map(
					(error: { endUserMessage: string | null; code: string }) =>
						error.endUserMessage || getTenantErrorMessage(error.code),
				),
			)
		}
		return errors.map(message => ({ message }))
	}, [requestState])

	const dispatch = useDispatch()
	const redirect = useRedirect()
	React.useEffect(() => {
		if (requestState.readyState === ApiRequestReadyState.Success) {
			const signIn = requestState.data.data.signIn
			const { ok, result } = signIn

			if (!ok || !result) {
				return
			}

			dispatch(
				createAction<AuthIdentity>(SET_IDENTITY, () => ({
					token: result.token,
					email: result.person.email,
					personId: result.person.id,
					projects: result.person.identity.projects.map(
						(it: any): Project => ({
							slug: it.project.slug,
							roles: it.memberships.map((membership: { role: string }) => membership.role),
						}),
					),
				}))(),
			)
			redirect(() => ({ name: 'projects_list' }))
		}
	}, [dispatch, redirect, requestState])

	return (
		<MiscPageLayout heading="Contember Admin">
			<form onSubmit={onSubmit}>
				<ErrorList size="large" errors={errorMessages} />
				<FormGroup label="Email">
					<TextInput
						value={email}
						autoComplete="username"
						type="email"
						autoFocus
						disabled={isLoading}
						onChange={onEmailChange}
					/>
				</FormGroup>
				<FormGroup label="Password">
					<TextInput
						type="password"
						autoComplete="current-password"
						value={password}
						disabled={isLoading}
						onChange={onPasswordChange}
					/>
				</FormGroup>
				<FormGroup label={undefined}>
					<Button type="submit" intent="primary" disabled={isLoading}>
						Submit
					</Button>
				</FormGroup>
			</form>
		</MiscPageLayout>
	)
})
Login.displayName = 'Login'
