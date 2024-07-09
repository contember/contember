import { ChangeMyPasswordFormErrorCode, useChangeMyPasswordForm } from '@contember/react-identity'
import { Button } from '../../ui/button'
import { Loader } from '../../ui/loader'
import { TenantFormError, TenantFormField } from './common'
import { dict } from '../../dict'


export const ChangeMyPasswordFormFields = () => {
	const form = useChangeMyPasswordForm()
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'submitting' ? <Loader position="absolute" /> : null}
			<TenantFormError
				form={form} messages={dict.tenant.changePassword.errorMessages}
			/>
			<TenantFormField
				form={form} messages={dict.tenant.changePassword.errorMessages} field="currentPassword"
				type="password" required autoFocus autoComplete="current-password"
			>
				{dict.tenant.changePassword.currentPassword}
			</TenantFormField>
			<TenantFormField
				form={form} messages={dict.tenant.changePassword.errorMessages} field="newPassword"
				type="password" required autoComplete="new-password"
			>
				{dict.tenant.changePassword.newPassword}
			</TenantFormField>
			<TenantFormField
				form={form} messages={dict.tenant.changePassword.errorMessages} field="passwordConfirmation"
				type="password" required autoComplete="new-password"
			>
				{dict.tenant.changePassword.confirmPassword}
			</TenantFormField>

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.changePassword.submit}
			</Button>
		</div>
	)
}
