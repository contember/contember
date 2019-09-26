import * as React from 'react'
import {
	Membership,
	useAddToast,
	useAuthedContentQuery,
	useListUsersQuery,
	useProjectSlug,
	useRemoveProjectMembership,
	useUpdateCurrentProjectMembership,
} from '../hooks'
import { Button, ButtonList, ContainerSpinner, Tag, TitleBar, Table2, Table2Cell, Table2Row } from '@contember/ui'
import { PageLinkButton } from '../../components/pageRouting'
import { ToastType } from '../../state/toasts'
import { getErrorCodeString } from '../hooks/strings'

export interface UsersListProps<T> {
	project: string
	children?: undefined
	rolesDataQuery: string
	roleRenderers: RoleRenderers<T>
}

interface Variables {
	[name: string]: string[]
}

interface RoleRenderers<T> {
	[role: string]: React.ComponentType<{ variables: Variables; rolesData: T }>
}

export const UsersList = React.memo<UsersListProps<any>>(({ project, roleRenderers, rolesDataQuery }) => {
	const addToast = useAddToast()
	const { state: query, refetch: refetchUserList } = useListUsersQuery(project)
	const { state: rolesData } = useAuthedContentQuery<any, {}>(rolesDataQuery, {})
	const [updateMembership, updateMembershipState] = useUpdateCurrentProjectMembership()
	const removeMembership = React.useCallback(
		async (identityId: string, memberships: Membership[], membershipToRemove: Membership) => {
			const confirmed = confirm(`Do you want to remove user's role in project?`)
			if (!confirmed) {
				return
			}
			const result = await updateMembership(
				identityId,
				memberships.filter(membership => membership !== membershipToRemove),
			)
			if (result.updateProjectMember.ok) {
				addToast({
					message: `Membership updated`,
					type: ToastType.Success,
				})
			} else {
				addToast({
					message: `Error updating membership: ${result.updateProjectMember.errors
						.map(it => getErrorCodeString(it.code))
						.join(', ')}`,
					type: ToastType.Error,
				})
			}
			await refetchUserList()
		},
		[addToast, refetchUserList, updateMembership],
	)
	const [removeMemberInner, removeMemberState] = useRemoveProjectMembership()
	const removeMember = React.useCallback(
		async (id: string) => {
			const confirmed = confirm('Do you want to remove user from project?')
			if (!confirmed) {
				return
			}
			const result = await removeMemberInner(project, id)
			if (result.removeProjectMember.ok) {
				addToast({
					message: `Member removed`,
					type: ToastType.Success,
				})
			} else {
				addToast({
					message: `Error removing member: ${result.removeProjectMember.errors
						.map(it => getErrorCodeString(it.code))
						.join(', ')}`,
					type: ToastType.Error,
				})
			}
			await refetchUserList()
		},
		[addToast, project, refetchUserList, removeMemberInner],
	)

	if (query.error || updateMembershipState.error || removeMemberState.error) {
		return <>Error loading data</>
	}

	if (query.loading || rolesData.loading || updateMembershipState.loading || removeMemberState.loading) {
		return <ContainerSpinner />
	}

	return (
		<div>
			<TitleBar actions={<PageLinkButton to="tenantInviteUser">Add a user</PageLinkButton>}>Users in project</TitleBar>
			<Table2>
				{query.data.project.members.map(member => (
					<Table2Row key={member.identity.id}>
						<Table2Cell>{member.identity.person ? member.identity.person.email : '?'}</Table2Cell>
						<Table2Cell>
							{member.memberships.map((membership, i) => {
								const Renderer =
									membership.role in roleRenderers
										? roleRenderers[membership.role]
										: () => <>Unknown role "{membership.role}"</>
								const vars: Variables = {}
								for (let variable of membership.variables) {
									vars[variable.name] = variable.values
								}
								return (
									<Tag
										key={membership.role}
										//onRemove={() => {
										//	removeMembership(member.identity.id, member.memberships, membership)
										//}}
									>
										{rolesData.error ? 'Error loading data' : <Renderer variables={vars} rolesData={rolesData.data} />}
									</Tag>
								)
							})}
						</Table2Cell>
						<Table2Cell>
							<ButtonList>
								<PageLinkButton
									size="small"
									to={() => ({ name: 'tenantEditUser', params: { id: member.identity.id } })}
								>
									Edit roles
								</PageLinkButton>
								<Button size="small" intent="danger" onClick={() => removeMember(member.identity.id)}>
									Revoke access
								</Button>
							</ButtonList>
						</Table2Cell>
					</Table2Row>
				))}
			</Table2>
		</div>
	)
})

type UsersManagementProps<T> = Omit<UsersListProps<T>, 'project'>

export const UsersManagement: React.FC<UsersManagementProps<any>> = <T extends {}>(props: UsersManagementProps<T>) => {
	const project = useProjectSlug()
	if (project) {
		return <UsersList project={project} {...props} />
	}
	return null
}
