import { useProjectSlug } from '@contember/react-client'
import { Button, LayoutPage, Stack, useShowToast } from '@contember/ui'
import { FC, memo, SyntheticEvent, useCallback, useEffect, useState } from 'react'
import { NavigateBackButton, RoutingLinkTarget, useRedirect } from '../../../routing'
import { useUpdateProjectMembership } from '../../mutations'
import { useProjectMembershipsQuery } from '../../queries'
import { Membership } from '../../types'
import { EditMembership, RolesConfig } from './EditMembership'

interface EditUserProps {
	project: string
	rolesConfig?: RolesConfig
	identityId: string
	userListLink: RoutingLinkTarget
}

export const EditIdentity: FC<EditUserProps> = ({ project, rolesConfig, identityId, userListLink }) => {
	const { state: previousMembershipsState } = useProjectMembershipsQuery(project, identityId)
	const [memberships, setMemberships] = useState<(Membership | undefined)[]>([undefined])

	const updateMembership = useUpdateProjectMembership()

	useEffect(() => {
		setMemberships(currentMemberships => {
			if (previousMembershipsState.state === 'success') {
				return previousMembershipsState.data.memberships
			}
			return currentMemberships
		})
	}, [previousMembershipsState])

	const redirect = useRedirect()
	const addToast = useShowToast()
	const [isSubmitting, setSubmitting] = useState(false)

	const submit = useCallback(
		async (e: SyntheticEvent) => {
			e.preventDefault()
			setSubmitting(true)
			const membershipsToSave = memberships.filter((it: Membership | undefined): it is Membership => it !== undefined)
			if (membershipsToSave.length === 0) {
				return
			}
			const result = await updateMembership({ projectSlug: project, identityId, memberships: membershipsToSave })
			setSubmitting(false)
			if (result.ok) {
				addToast({
					type: 'success',
					message: `Updated user's roles successfully.`,
					dismiss: true,
				})
				redirect(userListLink)
			} else {
				switch (result.error.code) {
					case 'NOT_MEMBER':
						return addToast({ message: `Project member not found`, type: 'error', dismiss: true })
					case 'INVALID_MEMBERSHIP':
						return addToast({ message: `Invalid membership definition`, type: 'error', dismiss: true })
					case 'PROJECT_NOT_FOUND':
						return addToast({ message: `Project not found`, type: 'error', dismiss: true })
				}
			}
		},
		[memberships, updateMembership, project, identityId, redirect, userListLink, addToast],
	)

	const editUserMembershipProps = { project, rolesConfig, memberships, setMemberships }
	return (
		<form onSubmit={submit}>
			<Stack direction="vertical" gap="large">
				<EditMembership {...editUserMembershipProps} />

				<Button distinction="primary" size="large" type="submit" disabled={isSubmitting}>
					Save
				</Button>
			</Stack>
		</form>
	)
}

export const EditUserInProject: FC<{ rolesConfig: RolesConfig; identityId: string }> = memo(
	({ rolesConfig, identityId }) => {
		const project = useProjectSlug()
		if (!project) {
			return <>Not in project.</>
		}
		return <LayoutPage
			title="Edit user"
			navigation={<NavigateBackButton to={'tenantUsers'}>Back to list of users</NavigateBackButton>}
		>
			<EditIdentity project={project} rolesConfig={rolesConfig} identityId={identityId} userListLink={'tenantUsers'} />
		</LayoutPage>
	},
)
