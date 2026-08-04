import { InviteFormErrorCode, useInviteForm } from '@contember/react-identity'
import { Button, CheckboxInput } from '@contember/react-ui-lib-base'
import { Loader } from '@contember/react-ui-lib-base'
import { TenantFormError, TenantFormField, TenantFormLabel } from './common.js'
import { MembershipsControl, RolesConfig, useIntrospectionRolesConfig } from './memberships-control.js'
import { dict } from '../dict.js'

export interface InviteFormFieldsProps {
	projectSlug: string
	roles?: RolesConfig
	/**
	 * Offers the "do not send an invitation e-mail" checkbox and the password
	 * field it reveals. Must be paired with `allowUnmanaged` on `InviteForm`;
	 * without it the form still mails.
	 */
	allowUnmanaged?: boolean
}

export const InviteFormFields = ({ projectSlug, roles, allowUnmanaged }: InviteFormFieldsProps) => {
	const form = useInviteForm()
	const rolesResolved = roles ?? useIntrospectionRolesConfig(projectSlug)
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'submitting' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form}
				messages={dict.tenant.invite.errorMessages}
			/>

			<TenantFormField
				form={form}
				messages={dict.tenant.invite.errorMessages}
				field="email"
				type="email"
				required
				autoFocus
			>
				{dict.tenant.invite.email}
			</TenantFormField>

			<TenantFormField
				form={form}
				messages={dict.tenant.invite.errorMessages}
				field="name"
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

			{allowUnmanaged && (
				<>
					<label className="flex items-center gap-2 mt-2">
						<CheckboxInput
							checked={form.values.unmanaged}
							onChange={e => form.setValue('unmanaged', e.target.checked)}
						/>
						<span className="text-sm">{dict.tenant.invite.unmanaged}</span>
					</label>
					<p className="text-sm text-gray-500">{dict.tenant.invite.unmanagedDescription}</p>

					{form.values.unmanaged && (
						<TenantFormField
							form={form}
							messages={dict.tenant.invite.errorMessages}
							field="password"
							type="password"
							autoComplete="new-password"
						>
							{dict.tenant.invite.password}
						</TenantFormField>
					)}
				</>
			)}

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{allowUnmanaged && form.values.unmanaged ? dict.tenant.invite.submitUnmanaged : dict.tenant.invite.submit}
			</Button>
		</div>
	)
}
