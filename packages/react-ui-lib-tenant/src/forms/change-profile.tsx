import { useChangeProfileForm } from '@contember/react-identity'
import { Button } from '@contember/react-ui-lib-base'
import { Loader } from '@contember/react-ui-lib-base'
import { TenantFormError, TenantFormField } from './common.js'
import { dict } from '../dict.js'

/**
 * `ChangeProfileFormFields` renders the fields of the admin `ChangeProfileForm` provider.
 *
 * ## Example
 * ```tsx
 * <ChangeProfileForm personId={personId} initialValues={{ email, name }}>
 * 	<form className="grid gap-4">
 * 		<ChangeProfileFormFields />
 * 	</form>
 * </ChangeProfileForm>
 * ```
 */
export const ChangeProfileFormFields = () => {
	const form = useChangeProfileForm()
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'submitting' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form}
				messages={dict.tenant.changeProfile.errorMessages}
			/>

			<TenantFormField
				form={form}
				messages={dict.tenant.changeProfile.errorMessages}
				field="email"
				type="email"
				autoComplete="off"
			>
				{dict.tenant.changeProfile.email}
			</TenantFormField>

			<TenantFormField
				form={form}
				messages={dict.tenant.changeProfile.errorMessages}
				field="name"
				type="text"
				autoComplete="off"
			>
				{dict.tenant.changeProfile.name}
			</TenantFormField>

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.changeProfile.submit}
			</Button>
		</div>
	)
}
