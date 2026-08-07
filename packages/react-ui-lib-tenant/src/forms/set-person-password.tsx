import { useChangePasswordForm } from '@contember/react-identity'
import { Button } from '@contember/react-ui-lib-base'
import { Loader } from '@contember/react-ui-lib-base'
import { TenantFormError, TenantFormField } from './common.js'
import { dict } from '../dict.js'

/**
 * `SetPersonPasswordFormFields` renders the fields of the admin `ChangePasswordForm` provider — an administrator
 * sets a password for another person, so no current password is asked for.
 *
 * ## Example
 * ```tsx
 * <ChangePasswordForm personId={personId}>
 * 	<form className="grid gap-4">
 * 		<SetPersonPasswordFormFields />
 * 	</form>
 * </ChangePasswordForm>
 * ```
 */
export const SetPersonPasswordFormFields = () => {
	const form = useChangePasswordForm()
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'submitting' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form}
				messages={dict.tenant.setPersonPassword.errorMessages}
			/>

			<TenantFormField
				form={form}
				messages={dict.tenant.setPersonPassword.errorMessages}
				field="password"
				type="password"
				required
				autoComplete="new-password"
			>
				{dict.tenant.setPersonPassword.password}
			</TenantFormField>

			<TenantFormField
				form={form}
				messages={dict.tenant.setPersonPassword.errorMessages}
				field="passwordConfirmation"
				type="password"
				required
				autoComplete="new-password"
			>
				{dict.tenant.setPersonPassword.passwordConfirmation}
			</TenantFormField>

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.setPersonPassword.submit}
			</Button>
		</div>
	)
}
