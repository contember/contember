import { getTenantErrorMessage } from '@contember/client'
import { Button, ErrorList, FieldError, FormGroup, Section, TextInput } from '@contember/ui'
import { useCallback, useState } from 'react'
import { useForm, useSignIn } from '../../index'
import { PageLink } from '../../../components'
import { RoutingLinkTarget } from '../../../routing'
import { useSetSessionToken } from '@contember/react-client'

export interface LoginProps {
	onLogin?: () => void
	resetLink?: RoutingLinkTarget
}

const initialValues = {
	email: '',
	password: '',
	otpToken: '',
}

export const Login = ({ onLogin, resetLink }: LoginProps) => {
	const [errors, setErrors] = useState<FieldError[]>([])
	const [otpRequired, setOtpRequired] = useState(false)
	const login = useSignIn()
	const setSessionToken = useSetSessionToken()

	const { onSubmit, isSubmitting, register } = useForm(initialValues, useCallback(async (values: typeof initialValues) => {
		const response = await login({
			email: values.email,
			password: values.password,
			otpToken: values.otpToken || undefined,
			expiration: 14 * 24 * 3600,
		})
		setErrors([])
		if (!response.ok) {
			const error = response.error
			if (response.error.code === 'OTP_REQUIRED') {
				setOtpRequired(true)
			} else {
				setErrors([{ message: getTenantErrorMessage(error.code) }])
			}
		} else {
			setSessionToken(response.result.token)
			onLogin?.()
		}
	}, [login, onLogin, setSessionToken]))


	return (
		<form onSubmit={onSubmit}>
			<Section>
				<ErrorList size="large" errors={errors} />
				<FormGroup label="Email">
					<TextInput
						{...register('email')}
						autoComplete="username"
						type="email"
						autoFocus={!otpRequired}
						disabled={otpRequired}
					/>
				</FormGroup>
				<FormGroup label="Password">
					<TextInput
						{...register('password')}
						type="password"
						autoComplete="current-password"
						disabled={otpRequired}
					/>
				</FormGroup>
				{otpRequired && <FormGroup label="Two-factor code">
					<TextInput
						autoFocus
						autoComplete={'one-time-code'}
						{...register('otpToken')}
					/>
				</FormGroup>}

				<FormGroup label={undefined}>
					<Button type="submit" intent="primary" disabled={isSubmitting}>
						Submit
					</Button>
					{resetLink && <PageLink to={resetLink} style={{ float: 'right' }}>Forgot your password?</PageLink>}
				</FormGroup>
			</Section>
		</form>
	)
}
