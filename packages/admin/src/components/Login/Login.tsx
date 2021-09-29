import { getTenantErrorMessage } from '@contember/client'
import { Button, ErrorList, FieldError, FormGroup, TextInput } from '@contember/ui'
import { useCallback, useRef, useState } from 'react'
import { MiscPageLayout } from '../MiscPageLayout'
import { useLogin } from '../../tenant'
import { Project } from '../Project'
import { RoutingLinkTarget } from '../../routing'
import { PageLink } from '../pageRouting'
import { useForm } from '../../tenant/components/useForm'

export interface LoginProps {
	onLogin: (projects: Project[], person: { id: string, email: string }) => void
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
	const login = useLogin()
	const { onSubmit, isSubmitting, register } = useForm(initialValues, useCallback(async (values: typeof initialValues) => {
		let projects: Project[] = []
		const response = await login({
			email: values.email,
			password: values.password,
			otpToken: values.otpToken || undefined,
			expiration: 14 * 24 * 3600,
		}, {
			onResponse: response => {
				projects = response.extensions?.contemberAdminServer?.projects ?? []
			},
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
			onLogin(
				projects,
				response.result.person,
			)
		}
	}, [login, onLogin]))


	return (
		<MiscPageLayout heading="Contember Admin">
			<form onSubmit={onSubmit}>
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
			</form>
		</MiscPageLayout>
	)
}
