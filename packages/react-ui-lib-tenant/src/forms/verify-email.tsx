import { useVerifyEmailForm } from '@contember/react-identity'
import { Button } from '@contember/react-ui-lib-base'
import { Loader } from '@contember/react-ui-lib-base'
import { TenantFormError, TenantFormField } from './common.js'
import { dict } from '../dict.js'

export const VerifyEmailFormFields = ({ hasToken }: { hasToken?: boolean }) => {
	const form = useVerifyEmailForm()
	const fieldErrors = form.errors.map(it => it.field)
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'success' || form.state === 'submitting' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form}
				messages={dict.tenant.verifyEmail.errorMessages}
			/>

			{(!hasToken || fieldErrors.includes('token')) && (
				<TenantFormField
					form={form}
					messages={dict.tenant.verifyEmail.errorMessages}
					field="token"
					type="text"
					required
					autoFocus
					autoComplete="off"
				>
					{dict.tenant.verifyEmail.token}
				</TenantFormField>
			)}

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.verifyEmail.submit}
			</Button>
		</div>
	)
}
