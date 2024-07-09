import { LoginFormErrorCode, useLoginForm } from '@contember/react-identity'
import { Button } from '../../ui/button'
import { Loader } from '../../ui/loader'
import { TenantFormError, TenantFormField } from './common'
import { dict } from '../../dict'
import { Link } from '@contember/interface'

export const LoginFormFields = () => {
	const form = useLoginForm()
	const fieldErrors = form.errors.map(it => it.field)
	return (
		<div className="relative flex flex-col gap-4">
			{form.state === 'success' || form.state === 'submitting' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form} messages={dict.tenant.login.errorMessages}
			/>

			<TenantFormField
				form={form} messages={dict.tenant.login.errorMessages} field="email"
				type="email" required autoFocus={form.state === 'initial'} readOnly={form.state === 'otp-required'} placeholder="me@example.com" autoComplete="email"
			>
				{dict.tenant.login.email}
			</TenantFormField>

			<TenantFormField
				form={form} messages={dict.tenant.login.errorMessages} field="password" autoComplete="current-password"
				type="password" required readOnly={form.state === 'otp-required'}
			>
				{dict.tenant.login.password}
				<Link to="resetRequest">
					<a className="float-end underline text-gray-600 text-sm font-normal">
						{dict.tenant.login.forgotPassword}
					</a>
				</Link>
			</TenantFormField>

			{(form.state === 'otp-required' || fieldErrors.includes('otpToken')) && (
				<TenantFormField
					form={form} messages={dict.tenant.login.errorMessages} field="otpToken" autoComplete="one-time-code"
					type="text" required autoFocus maxLength={6}
				>
					{dict.tenant.login.otpToken}
				</TenantFormField>
			)}

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.login.login}
			</Button>
		</div>
	)
}
