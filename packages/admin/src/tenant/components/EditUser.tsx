import { FC, memo, useCallback, useEffect, useState } from 'react'
import { useProjectMembershipsQuery } from '../hooks/projectMemberships'
import { Membership } from './VariableSelector'
import { useUpdateProjectMembership } from '../hooks'
import { getTenantErrorMessage } from '@contember/client'
import { NavigateBackButton, useRedirect, useShowToast } from '../../components'
import { EditUserMembership, EditUserMembershipProps, RolesConfig, SubmitState } from './EditUserMembership'
import { useProjectSlug } from '@contember/react-client'
import { RoutingLinkTarget } from '../../routing'
import { TitleBar } from '@contember/ui'

interface EditUserProps {
	project: string
	rolesConfig?: RolesConfig
	identityId: string
	userListLink: RoutingLinkTarget
}

export const EditUser: FC<EditUserProps> = ({ project, rolesConfig, identityId, userListLink }) => {
	const { state: previousMembershipsState } = useProjectMembershipsQuery(project, identityId)
	const [memberships, setMemberships] = useState<(Membership | undefined)[]>([undefined])

	const [updateMembership, updateMembershipElement] = useUpdateProjectMembership()
	const submitState: SubmitState | undefined = {
		loading: updateMembershipElement.loading,
		success:
			updateMembershipElement.finished &&
			!updateMembershipElement.error &&
			updateMembershipElement.data.updateProjectMember.ok,
		errorEmail: undefined,
		error: updateMembershipElement.error
			? 'Unable to submit'
			: updateMembershipElement.finished && !updateMembershipElement.data.updateProjectMember.ok
				? updateMembershipElement.data.updateProjectMember.errors.map(it => getTenantErrorMessage(it.code)).join(', ')
				: undefined,
	}

	useEffect(() => {
		setMemberships(currentMemberships => {
			if (
				currentMemberships.every(it => it === undefined) &&
				previousMembershipsState.finished &&
				!previousMembershipsState.error
			) {
				return previousMembershipsState.data.memberships
			}
			return currentMemberships
		})
	}, [previousMembershipsState.data, previousMembershipsState.error, previousMembershipsState.finished])

	const redirect = useRedirect()
	const addToast = useShowToast()

	const submit = useCallback(async () => {
		const membershipsToSave = memberships.filter((it: Membership | undefined): it is Membership => it !== undefined)
		if (membershipsToSave.length === 0) {
			return
		}
		const result = await updateMembership(project, identityId, membershipsToSave)
		if (result.updateProjectMember.ok) {
			redirect(userListLink)
			addToast({
				type: 'success',
				message: `Updated user's roles successfully.`,
			})
		}
	}, [memberships, updateMembership, project, identityId, redirect, userListLink, addToast])

	const props: EditUserMembershipProps = {
		project: project,
		rolesConfig: rolesConfig,
		memberships: memberships,
		setMemberships: setMemberships,
		email: undefined,
		setEmail: undefined,
		submit: submit,
		submitState,
	}

	return <EditUserMembership {...props} />
}


export const EditUserInProject: FC<{ rolesConfig: RolesConfig; identityId: string }> = memo(
	({ rolesConfig, identityId }) => {
		const project = useProjectSlug()
		if (!project) {
			return <>Not in project.</>
		}
		return <>
			<TitleBar navigation={<NavigateBackButton to={'tenantUsers'}>Back to list of users</NavigateBackButton>}>
				Edit user
			</TitleBar>
			<EditUser
				project={project}
				rolesConfig={rolesConfig}
				identityId={identityId}
				userListLink={'tenantUsers'}
			/>
		</>
	},
)
