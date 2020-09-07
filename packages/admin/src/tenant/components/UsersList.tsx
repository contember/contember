import { getTenantErrorMessage } from '@contember/client'
import * as React from 'react'
import { useProjectSlug } from '@contember/react-client'
import {
	Membership,
	useAddToast,
	useAuthedContentQuery,
	useListUsersQuery,
	useRemoveProjectMembership,
	useUpdateCurrentProjectMembership,
} from '../hooks'
import { Button, ButtonList, ContainerSpinner, Tag, TitleBar, Table, TableCell, TableRow } from '@contember/ui'
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
					type: 'success',
				})
			} else {
				addToast({
					message: `Error updating membership: ${result.updateProjectMember.errors
						.map(it => getTenantErrorMessage(it.code))
						.join(', ')}`,
					type: 'error',
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
					type: 'success',
				})
			} else {
				addToast({
					message: `Error removing member: ${result.removeProjectMember.errors
						.map(it => getTenantErrorMessage(it.code))
						.join(', ')}`,
					type: 'error',
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
			<Table>
				{query.data.project.members.map(member => {
					if (!member.identity.person) {
						return <React.Fragment key={member.identity.id} />
					}
					return (
						<TableRow key={member.identity.id}>
							<TableCell>{member.identity.person ? member.identity.person.email : '?'}</TableCell>
							<TableCell>
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
											{rolesData.error ? (
												'Error loading data'
											) : (
												<Renderer variables={vars} rolesData={rolesData.data} />
											)}
										</Tag>
									)
								})}
							</TableCell>
							<TableCell shrunk>
								<PageLinkButton
									size="small"
									to={() => ({ name: 'tenantEditUser', params: { id: member.identity.id } })}
								>
									Edit roles
								</PageLinkButton>
							</TableCell>
							<TableCell shrunk>
								<Button size="small" intent="danger" onClick={() => removeMember(member.identity.id)}>
									Revoke access
								</Button>
							</TableCell>
						</TableRow>
					)
				})}
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
