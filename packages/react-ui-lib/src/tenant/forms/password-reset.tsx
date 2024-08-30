import { usePasswordResetForm } from '@contember/react-identity'
import { Button } from '../../ui/button'
import { Loader } from '../../ui/loader'
import { TenantFormError, TenantFormField } from './common'
import { dict } from '../../dict'


export const PasswordResetFormFields = ({ hasToken }: { hasToken?: boolean }) => {
	const form = usePasswordResetForm()
	const fieldErrors = form.errors.map(it => it.field)
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'success' || form.state === 'submitting' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form} messages={dict.tenant.passwordReset.errorMessages}
			/>

			{(!hasToken || fieldErrors.includes('token')) && (
				<TenantFormField
					form={form} messages={dict.tenant.passwordReset.errorMessages} field="token"
					type="text" required autoComplete="off"
				>
					{dict.tenant.passwordReset.token}
				</TenantFormField>
			)}

			<TenantFormField
				form={form} messages={dict.tenant.passwordReset.errorMessages} field="password"
				type="password" required autoFocus autoComplete="new-password"
			>
				{dict.tenant.passwordReset.password}
			</TenantFormField>

			<TenantFormField
				form={form} messages={dict.tenant.passwordReset.errorMessages} field="passwordConfirmation"
				type="password" required autoComplete="new-password"
			>
				{dict.tenant.passwordReset.passwordConfirmation}
			</TenantFormField>

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.passwordReset.submit}
			</Button>
		</div>
	)
}
