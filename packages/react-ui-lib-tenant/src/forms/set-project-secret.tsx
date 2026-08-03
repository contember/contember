import { useSetProjectSecretForm } from '@contember/react-identity'
import { Button } from '@contember/react-ui-lib-base'
import { Loader } from '@contember/react-ui-lib-base'
import { TenantFormError, TenantFormField } from './common.js'
import { dict } from '../dict.js'

/**
 * `SetProjectSecretFormFields` renders the fields of the `SetProjectSecretForm` provider.
 *
 * ## Example
 * ```tsx
 * <SetProjectSecretForm projectSlug={projectSlug} onSuccess={() => controller.current?.refresh()}>
 * 	<form className="grid gap-4">
 * 		<SetProjectSecretFormFields />
 * 	</form>
 * </SetProjectSecretForm>
 * ```
 */
export const SetProjectSecretFormFields = () => {
	const form = useSetProjectSecretForm()
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'submitting' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form}
				messages={dict.tenant.setProjectSecret.errorMessages}
			/>

			<TenantFormField
				form={form}
				messages={dict.tenant.setProjectSecret.errorMessages}
				field="key"
				type="text"
				required
				autoFocus
				autoComplete="off"
			>
				{dict.tenant.setProjectSecret.key}
			</TenantFormField>

			{/* A secret value must not be readable over the shoulder of whoever enters it. */}
			<TenantFormField
				form={form}
				messages={dict.tenant.setProjectSecret.errorMessages}
				field="value"
				type="password"
				required
				autoComplete="off"
			>
				{dict.tenant.setProjectSecret.value}
			</TenantFormField>

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.setProjectSecret.submit}
			</Button>
		</div>
	)
}
