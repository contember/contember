import { CreateApiKeyFormErrorCode, useCreateApiKeyForm } from '@contember/react-identity'
import { Button } from '../../ui/button'
import { Loader } from '../../ui/loader'
import { TenantFormError, TenantFormField, TenantFormLabel } from './common'
import { MembershipsControl, useIntrospectionRolesConfig } from './memberships-control'
import { dict } from '../../dict'


export const CreateApiKeyFormFields = ({ projectSlug }: {projectSlug: string}) => {
	const form = useCreateApiKeyForm()
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'submitting' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form} messages={dict.tenant.createApiKey.errorMessages}
			/>

			<TenantFormField
				form={form} messages={dict.tenant.createApiKey.errorMessages} field="description"
				type="text" required autoFocus
			>
				{dict.tenant.createApiKey.description}
			</TenantFormField>

			<TenantFormLabel form={form} field="memberships">{dict.tenant.createApiKey.roles}</TenantFormLabel>
			<MembershipsControl
				memberships={form.values.memberships}
				setMemberships={it => form.setValue('memberships', it)}
				roles={useIntrospectionRolesConfig(projectSlug)}
			/>
			<TenantFormError form={form} messages={dict.tenant.createApiKey.errorMessages} field="memberships" />

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.createApiKey.submit}
			</Button>
		</div>
	)
}
