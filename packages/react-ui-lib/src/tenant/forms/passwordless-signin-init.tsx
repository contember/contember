import { usePasswordlessSignInInitForm } from '@contember/react-identity'
import { Button } from '../../ui/button'
import { Loader } from '../../ui/loader'
import { TenantFormError, TenantFormField } from './common'
import { dict } from '../../dict'


export const PasswordlessSignInInitFormFields = () => {
	const form = usePasswordlessSignInInitForm()
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'success' || form.state === 'submitting' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form} messages={dict.tenant.passwordlessSignInInit.errorMessages}
			/>

			<TenantFormField
				form={form} messages={dict.tenant.passwordlessSignInInit.errorMessages} field="email"
				type="email" required autoFocus autoComplete="email"
			>
				{dict.tenant.passwordlessSignInInit.email}
			</TenantFormField>

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.passwordlessSignInInit.submit}
			</Button>
		</div>
	)
}

