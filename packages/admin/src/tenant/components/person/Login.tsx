import { getTenantErrorMessage } from '@contember/client'
import { useSetSessionToken } from '@contember/react-client'
import { Button, ErrorList, FieldContainer, FieldError, Stack, TextInput } from '@contember/ui'
import { useCallback, useState } from 'react'
import { Link, RoutingLinkTarget } from '../../../routing'
import { useForm, useSignIn } from '../../index'

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
			<Stack direction="vertical" gap="large">
				<ErrorList errors={errors} />
				<FieldContainer label="Email">
					<TextInput
						{...register('email')}
						autoComplete="username"
						type="email"
						autoFocus={!otpRequired}
						disabled={otpRequired}
					/>
				</FieldContainer>
				<FieldContainer label="Password">
					<TextInput
						{...register('password')}
						type="password"
						autoComplete="current-password"
						disabled={otpRequired}
					/>
				</FieldContainer>
				{otpRequired && <FieldContainer label="Two-factor code">
					<TextInput
						autoFocus
						autoComplete={'one-time-code'}
						{...register('otpToken')}
					/>
				</FieldContainer>}
				<Stack direction="horizontal" align="center" justify="space-between">
					<Button type="submit" distinction="primary" disabled={isSubmitting}>
						Submit
					</Button>
					{resetLink && <Link to={resetLink}>Forgot your password?</Link>}
				</Stack>
			</Stack>
		</form>
	)
}
