import { usePasswordlessSignInForm } from '@contember/react-identity'
import { Button } from '../../ui/button'
import { Loader } from '../../ui/loader'
import { TenantFormError, TenantFormField } from './common'
import { dict } from '../../dict'
import { useEffect, useRef, useState } from 'react'


export const PasswordlessSignInFormFields = ({ type, email }: { type: 'token' | 'otp'; email?: string }) => {
	const form = usePasswordlessSignInForm()
	const fieldErrors = form.errors.map(it => it.field)
	const buttonRef = useRef<HTMLButtonElement | null>(null)
	const [initialTokenValue] = useState(form.values.token)
	const hasToken = type === 'token' && initialTokenValue
	useEffect(() => {
		if (hasToken) {
			buttonRef.current?.click()
		}
	}, [hasToken])
	const setValues = form.setValues

	useEffect(() => {
		if (type === 'otp') {
			setValues(it => ({ ...it, token: it.token.toUpperCase() }))
		}
	}, [setValues, type, form.values.token])

	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'success' || form.state === 'submitting' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form} messages={dict.tenant.passwordlessSignIn.errorMessages}
			/>

			{(!hasToken || fieldErrors.includes('token')) && <TenantFormField
				form={form} messages={dict.tenant.passwordlessSignIn.errorMessages} field="token"
				type="text" required autoComplete="off" autoFocus
				className={type === 'otp' ? 'text-2xl font-bold font-mono' : ''}
			>
				{dict.tenant.passwordlessSignIn.token}
			</TenantFormField>}

			{(form.state === 'otp-required' || fieldErrors.includes('otpToken')) && (
				<TenantFormField
					form={form} messages={dict.tenant.passwordlessSignIn.errorMessages} field="otpToken" autoComplete="one-time-code"
					type="text" required autoFocus maxLength={6}
				>
					{dict.tenant.passwordlessSignIn.otpToken}
				</TenantFormField>
			)}

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'} ref={buttonRef}>
				{dict.tenant.passwordlessSignIn.submit}
			</Button>
		</div>
	)
}

