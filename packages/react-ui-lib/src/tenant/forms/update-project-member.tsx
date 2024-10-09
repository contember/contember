import { useUpdateProjectMemberForm } from '@contember/react-identity'
import { Button } from '../../ui/button'
import { Loader } from '../../ui/loader'
import { TenantFormError, TenantFormLabel } from './common'
import { MembershipsControl, RolesConfig, useIntrospectionRolesConfig } from './memberships-control'
import { dict } from '../../dict'


export const UpdateProjectMemberFormFields = ({ projectSlug, roles }: {projectSlug: string; roles?: RolesConfig}) => {
	const form = useUpdateProjectMemberForm()
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const rolesResolved = roles ?? useIntrospectionRolesConfig(projectSlug)
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'submitting' || form.state === 'loading' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form} messages={dict.tenant.updateProjectMember.errorMessages}
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
