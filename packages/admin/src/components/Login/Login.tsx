import { getTenantErrorMessage } from '@contember/client'
import { useLoginRequest } from '@contember/react-client'
import { Button, ErrorList, FormGroup, TextInput } from '@contember/ui'
import { ChangeEvent, FormEvent, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { createAction } from 'redux-actions'
import { SET_IDENTITY } from '../../reducer/auth'
import type { AuthIdentity, Project } from '../../state/auth'
import { MiscPageLayout } from '../MiscPageLayout'
import { useRedirect } from '../pageRouting'

export const Login = memo(() => {
	const [requestState, login] = useLoginRequest()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const isLoading = requestState.isLoading

	const onSubmit = useCallback(
		(e: FormEvent<HTMLFormElement>) => {
			e.preventDefault()
			login(email, password)
		},
		[email, login, password],
	)
	const onEmailChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value), [])
	const onPasswordChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value), [])

	const errorMessages = useMemo(() => {
		let errors: string[] = []

		if (requestState.readyState === 'networkError') {
			errors.push('Something went wrong. Please try again.')
		} else if (requestState.readyState === 'networkSuccess') {
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
	useEffect(() => {
		if (requestState.readyState === 'networkSuccess') {
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
