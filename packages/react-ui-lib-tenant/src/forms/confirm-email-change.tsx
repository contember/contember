import { useConfirmEmailChangeForm } from '@contember/react-identity'
import { Button } from '@contember/react-ui-lib-base'
import { Loader } from '@contember/react-ui-lib-base'
import { TenantFormError, TenantFormField } from './common'
import { dict } from '../dict'

export const ConfirmEmailChangeFormFields = ({ hasToken }: { hasToken?: boolean }) => {
	const form = useConfirmEmailChangeForm()
	const fieldErrors = form.errors.map(it => it.field)
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'success' || form.state === 'submitting' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form}
				messages={dict.tenant.confirmEmailChange.errorMessages}
			/>

			{(!hasToken || fieldErrors.includes('token')) && (
				<TenantFormField
					form={form}
					messages={dict.tenant.confirmEmailChange.errorMessages}
					field="token"
					type="text"
					required
					autoFocus
					autoComplete="off"
				>
					{dict.tenant.confirmEmailChange.token}
				</TenantFormField>
			)}

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.confirmEmailChange.submit}
			</Button>
		</div>
	)
}
