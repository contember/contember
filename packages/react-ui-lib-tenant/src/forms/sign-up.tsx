import { useSignUpForm } from '@contember/react-identity'
import { Button } from '@contember/react-ui-lib-base'
import { Loader } from '@contember/react-ui-lib-base'
import { TenantFormError, TenantFormField } from './common.js'
import { dict } from '../dict.js'

/**
 * Fields for open registration. `signUp` creates the account but does not sign
 * anyone in — the surrounding page decides what happens next.
 */
export const SignUpFormFields = ({ showName = true }: { showName?: boolean }) => {
	const form = useSignUpForm()
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'success' || form.state === 'submitting' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form}
				messages={dict.tenant.signUp.errorMessages}
			/>

			<TenantFormField
				form={form}
				messages={dict.tenant.signUp.errorMessages}
				field="email"
				type="email"
				required
				autoFocus
				autoComplete="email"
			>
				{dict.tenant.signUp.email}
			</TenantFormField>

			{showName && (
				<TenantFormField
					form={form}
					messages={dict.tenant.signUp.errorMessages}
					field="name"
					type="text"
					autoComplete="name"
				>
					{dict.tenant.signUp.name}
				</TenantFormField>
			)}

			<TenantFormField
				form={form}
				messages={dict.tenant.signUp.errorMessages}
				field="password"
				type="password"
				required
				autoComplete="new-password"
			>
				{dict.tenant.signUp.password}
			</TenantFormField>

			<TenantFormField
				form={form}
				messages={dict.tenant.signUp.errorMessages}
				field="passwordConfirmation"
				type="password"
				required
				autoComplete="new-password"
			>
				{dict.tenant.signUp.passwordConfirmation}
			</TenantFormField>

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.signUp.submit}
			</Button>
		</div>
	)
}
