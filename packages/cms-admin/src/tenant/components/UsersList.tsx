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
import { Button, ButtonList, ContainerSpinner, Tag, TitleBar } from '@contember/ui'
import { Table } from '../../components/ui'
import { PageLinkButton } from '../../components/pageRouting'
import { ToastType } from '../../state/toasts'

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
					message: `Error updating membership: ${result.updateProjectMember.errors.map(it => it.code).join(', ')}`,
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
					message: `Error removing member: ${result.removeProjectMember.errors.map(it => it.code).join(', ')}`,
					type: ToastType.Error,
				})
			}
			await refetchUserList()
		},
		[addToast, project, refetchUserList, removeMemberInner],
	)

	if (query.error || rolesData.error || updateMembershipState.error || removeMemberState.error) {
		return <>Error loading data</>
	}

	if (query.loading || rolesData.loading || updateMembershipState.loading || removeMemberState.loading) {
		return <ContainerSpinner />
	}

	return (
		<div>
			<TitleBar actions={<PageLinkButton to="tenantInviteUser">Add a user</PageLinkButton>}>Users in project</TitleBar>
			<Table>
				{query.data.project.members.map(member => (
					<Table.Row key={member.identity.id}>
						<Table.Cell>{member.identity.person ? member.identity.person.email : '?'}</Table.Cell>
						<Table.Cell>
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
										onRemove={() => {
											removeMembership(member.identity.id, member.memberships, membership)
										}}
									>
										<Renderer variables={vars} rolesData={rolesData.data} />
									</Tag>
								)
							})}
						</Table.Cell>
						<Table.Cell>
							<ButtonList>
								<PageLinkButton
									distinction="outlined"
									to={() => ({ name: 'tenantEditUser', params: { id: member.identity.id } })}
								>
									Add role
								</PageLinkButton>
								<Button intent="danger" distinction="outlined" onClick={() => removeMember(member.identity.id)}>
									Revoke access
								</Button>
							</ButtonList>
						</Table.Cell>
					</Table.Row>
				))}
			</Table>
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
