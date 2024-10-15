import { InviteFormErrorCode, useInviteForm } from '@contember/react-identity'
import { Button } from '../../ui/button'
import { Loader } from '../../ui/loader'
import { TenantFormError, TenantFormField, TenantFormLabel } from './common'
import { MembershipsControl, RolesConfig, useIntrospectionRolesConfig } from './memberships-control'
import { dict } from '../../dict'


export const InviteFormFields = ({ projectSlug, roles }: {projectSlug: string; roles?: RolesConfig}) => {
	const form = useInviteForm()
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const rolesResolved = roles ?? useIntrospectionRolesConfig(projectSlug)
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
				roles={rolesResolved}
			/>

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.invite.submit}
			</Button>
		</div>
	)
}
