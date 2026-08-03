import { useAddProjectMemberForm } from '@contember/react-identity'
import { Button } from '@contember/react-ui-lib-base'
import { Loader } from '@contember/react-ui-lib-base'
import { TenantFormError, TenantFormField, TenantFormLabel } from './common.js'
import { MembershipsControl, RolesConfig, useIntrospectionRolesConfig } from './memberships-control.js'
import { dict } from '../dict.js'

/**
 * `AddProjectMemberFormFields` renders the fields of the `AddProjectMemberForm` provider — it adds an existing
 * identity (as opposed to inviting a new person) to a project.
 *
 * ## Example
 * ```tsx
 * <AddProjectMemberFormFields projectSlug="my-project" />
 * ```
 */
export const AddProjectMemberFormFields = ({ projectSlug, roles }: { projectSlug: string; roles?: RolesConfig }) => {
	const form = useAddProjectMemberForm()
	const rolesResolved = roles ?? useIntrospectionRolesConfig(projectSlug)
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'submitting' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form}
				messages={dict.tenant.addProjectMember.errorMessages}
			/>

			<TenantFormField
				form={form}
				messages={dict.tenant.addProjectMember.errorMessages}
				field="identityId"
				type="text"
				required
				autoFocus
				autoComplete="off"
			>
				{dict.tenant.addProjectMember.identityId}
			</TenantFormField>

			<TenantFormLabel form={form} field="memberships">{dict.tenant.addProjectMember.roles}</TenantFormLabel>
			<TenantFormError form={form} messages={dict.tenant.addProjectMember.errorMessages} field="memberships" />
			<MembershipsControl
				memberships={form.values.memberships}
				setMemberships={it => form.setValue('memberships', it)}
				roles={rolesResolved}
			/>

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.addProjectMember.submit}
			</Button>
		</div>
	)
}
