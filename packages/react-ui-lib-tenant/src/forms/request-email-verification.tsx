import { useRequestEmailVerificationForm } from '@contember/react-identity'
import { Button } from '@contember/react-ui-lib-base'
import { Loader } from '@contember/react-ui-lib-base'
import { TenantFormError, TenantFormField } from './common.js'
import { dict } from '../dict.js'

export const RequestEmailVerificationFormFields = () => {
	const form = useRequestEmailVerificationForm()
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'success' || form.state === 'submitting' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form}
				messages={dict.tenant.requestEmailVerification.errorMessages}
			/>

			<TenantFormField
				form={form}
				messages={dict.tenant.requestEmailVerification.errorMessages}
				field="email"
				type="email"
				required
				autoFocus
				autoComplete="email"
			>
				{dict.tenant.requestEmailVerification.email}
			</TenantFormField>

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.requestEmailVerification.submit}
			</Button>
		</div>
	)
}
