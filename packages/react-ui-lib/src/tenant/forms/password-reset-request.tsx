import { usePasswordResetRequestForm } from '@contember/react-identity'
import { Button } from '../../ui/button'
import { Loader } from '../../ui/loader'
import { TenantFormError, TenantFormField } from './common'
import { dict } from '../../dict'


export const PasswordResetRequestFormFields = () => {
	const form = usePasswordResetRequestForm()
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'success' || form.state === 'submitting' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form} messages={dict.tenant.passwordResetRequest.errorMessages}
			/>

			<TenantFormField
				form={form} messages={dict.tenant.passwordResetRequest.errorMessages} field="email"
				type="email" required autoFocus autoComplete="email"
			>
				{dict.tenant.passwordResetRequest.email}
			</TenantFormField>

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.passwordReset.submit}
			</Button>
		</div>
	)
}

