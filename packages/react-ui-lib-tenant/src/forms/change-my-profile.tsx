import { useChangeMyProfileForm } from '@contember/react-identity'
import { Button } from '@contember/react-ui-lib-base'
import { Loader } from '@contember/react-ui-lib-base'
import { TenantFormError, TenantFormField } from './common.js'
import { dict } from '../dict.js'

export const ChangeMyProfileFormFields = () => {
	const form = useChangeMyProfileForm()
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'submitting' ? <Loader position="absolute" /> : null}
			<TenantFormError
				form={form}
				messages={dict.tenant.changeMyProfile.errorMessages}
			/>
			<TenantFormField
				form={form}
				messages={dict.tenant.changeMyProfile.errorMessages}
				field="email"
				type="email"
				autoComplete="email"
			>
				{dict.tenant.changeMyProfile.email}
			</TenantFormField>
			<TenantFormField
				form={form}
				messages={dict.tenant.changeMyProfile.errorMessages}
				field="name"
				type="text"
				autoComplete="name"
			>
				{dict.tenant.changeMyProfile.name}
			</TenantFormField>

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.changeMyProfile.submit}
			</Button>
		</div>
	)
}
