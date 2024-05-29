import { InviteFormErrorCode, useInviteForm } from '@contember/react-identity'
import { Button } from '../ui/button'
import { Loader } from '../ui/loader'
import { TenantFormError, TenantFormField, TenantFormLabel } from './common'
import { MembershipsControl, useIntrospectionRolesConfig } from './membershipsControl'
import { dict } from '../../dict'


export const InviteFormFields = ({ projectSlug }: {projectSlug: string}) => {
	const form = useInviteForm()
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'submitting' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form} messages={dict.tenant.invite.errorMessages}
			/>

			<TenantFormField
				form={form} messages={dict.tenant.invite.errorMessages} field="email"
				type="email" required autoFocus
			>
				{dict.tenant.invite.email}
			</TenantFormField>

			<TenantFormField
				form={form} messages={dict.tenant.invite.errorMessages} field="name"
				type="text"
			>
				{dict.tenant.invite.name}
			</TenantFormField>

			<TenantFormLabel form={form} field="memberships">{dict.tenant.invite.roles}</TenantFormLabel>
			<TenantFormError form={form} messages={dict.tenant.invite.errorMessages} field="memberships" />
			<MembershipsControl
				memberships={form.values.memberships}
				setMemberships={it => form.setValue('memberships', it)}
				roles={useIntrospectionRolesConfig(projectSlug)}
			/>

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.invite.submit}
			</Button>
		</div>
	)
}
