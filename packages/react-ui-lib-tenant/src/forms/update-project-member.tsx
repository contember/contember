import { useUpdateProjectMemberForm } from '@contember/react-identity'
import { Button } from '@contember/react-ui-lib-base'
import { Loader } from '@contember/react-ui-lib-base'
import { TenantFormError, TenantFormLabel } from './common.js'
import { MembershipsControl, RolesConfig, useIntrospectionRolesConfig } from './memberships-control.js'
import { dict } from '../dict.js'

/**
 * `UpdateProjectMemberFormFields` is a component for managing and updating a project member's roles and memberships.
 * It integrates with the `useUpdateProjectMemberForm` hook and supports role introspection.
 *
 * ## Example
 * ```tsx
 * <UpdateProjectMemberFormFields projectSlug="my-project" />
 * ```
 */
export const UpdateProjectMemberFormFields = ({ projectSlug, roles }: { projectSlug: string; roles?: RolesConfig }) => {
	const form = useUpdateProjectMemberForm()
	const rolesResolved = roles ?? useIntrospectionRolesConfig(projectSlug)
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'submitting' || form.state === 'loading' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form}
				messages={dict.tenant.updateProjectMember.errorMessages}
			/>

			<TenantFormLabel form={form} field="memberships">{dict.tenant.updateProjectMember.roles}</TenantFormLabel>
			<TenantFormError form={form} messages={dict.tenant.updateProjectMember.errorMessages} field="memberships" />
			<MembershipsControl
				memberships={form.values?.memberships ?? []}
				setMemberships={it => form.setValue('memberships', it)}
				roles={rolesResolved}
			/>

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.updateProjectMember.submit}
			</Button>
		</div>
	)
}
