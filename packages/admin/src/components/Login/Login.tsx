import { getTenantErrorMessage } from '@contember/client'
import { Button, ErrorList, FieldError, FormGroup, TextInput } from '@contember/ui'
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react'
import { MiscPageLayout } from '../MiscPageLayout'
import { useLogin } from '../../tenant'
import { Project } from '../Project'
import { RoutingLinkTarget } from '../../routing'
import { PageLink } from '../pageRouting'

export interface LoginProps {
	onLogin: (projects: Project[], person: { id: string, email: string }) => void
	resetLink?: RoutingLinkTarget
}

export const Login = ({ onLogin, resetLink }: LoginProps) => {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [errors, setErrors] = useState<FieldError[]>([])
	const [triggerLogin, loginState] = useLogin()

	const onEmailChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value), [setEmail])
	const onPasswordChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value), [setPassword])

	const onSubmit = useCallback(
		(e: FormEvent<HTMLFormElement>) => {
			e.preventDefault()
			triggerLogin({ email, password, expiration: 14 * 24 * 3600 })
		},
		[triggerLogin, email, password],
	)

	useEffect(
		() => {
			if (loginState.finished) {
				if (loginState.error) {
					setErrors([{ message: 'Something went wrong. Please try again.' }])

				} else if (!loginState.data.signIn.ok) {
					setErrors(loginState.data.signIn.errors.map(error => ({
						message: error.endUserMessage ?? getTenantErrorMessage(error.code),
					})))

				} else {
					setErrors([])
					onLogin(
						loginState.extensions.contemberAdminServer.projects,
						loginState.data.signIn.result.person,
					)
				}
			}
		},
		[loginState, onLogin],
	)

	return (
		<MiscPageLayout heading="Contember Admin">
			<form onSubmit={onSubmit}>
				<ErrorList size="large" errors={errors} />
				<FormGroup label="Email">
					<TextInput
						value={email}
						autoComplete="username"
						type="email"
						autoFocus
						disabled={loginState.loading}
						onChange={onEmailChange}
					/>
				</FormGroup>
				<FormGroup label="Password">
					<TextInput
						type="password"
						autoComplete="current-password"
						value={password}
						disabled={loginState.loading}
						onChange={onPasswordChange}
					/>
				</FormGroup>
				<FormGroup label={undefined}>
					<Button type="submit" intent="primary" disabled={loginState.loading}>
						Submit
					</Button>
					{resetLink && <PageLink to={resetLink} style={{ float: 'right' }}>Forgot your password?</PageLink>}
				</FormGroup>
			</form>
		</MiscPageLayout>
	)
}
