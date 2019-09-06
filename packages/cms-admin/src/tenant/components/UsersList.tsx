import * as React from 'react'
import {
	Membership,
	useAuthedContentQuery,
	useListUsersQuery,
	useUpdateCurrentProjectMembership,
	useRemoveCurrentProjectMembership,
	useProjectSlug,
	useRemoveProjectMembership,
} from '../hooks'
import { Button, ButtonGroup, Tag, TitleBar } from '@contember/ui'
import { LoadingSpinner } from '../../binding/facade/renderers/userFeedback'
import { Table } from '../../components/ui'
import { PageLinkButton } from '../../components/pageRouting'

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
	const { state: query, refetch: refetchUserList } = useListUsersQuery(project)
	const { state: rolesData } = useAuthedContentQuery<any, {}>(rolesDataQuery, {})
	const [updateMembership, updateMembershipState] = useUpdateCurrentProjectMembership()
	const removeMembership = React.useCallback(
		async (identityId: string, memberships: Membership[], membershipToRemove: Membership) => {
			await updateMembership(identityId, memberships.filter(membership => membership !== membershipToRemove))
			await refetchUserList()
		},
		[refetchUserList, updateMembership],
	)
	const [removeMemberInner, removeMemberState] = useRemoveProjectMembership()
	const removeMember = React.useCallback(
		async (id: string) => {
			await removeMemberInner(project, id)
			await refetchUserList()
		},
		[project, refetchUserList, removeMemberInner],
	)

	if (query.error || rolesData.error || updateMembershipState.error || removeMemberState.error) {
		return <>Error</>
	}

	if (query.loading || rolesData.loading || updateMembershipState.loading || removeMemberState.loading) {
		return <LoadingSpinner />
	}

	if (updateMembershipState.finished && !updateMembershipState.data.updateProjectMember.ok) {
		return (
			<>
				Error updating membership: {updateMembershipState.data.updateProjectMember.errors.map(it => it.code).join(', ')}
			</>
		)
	}

	if (removeMemberState.finished && !removeMemberState.data.removeProjectMember.ok) {
		return <>Error removing member: {removeMemberState.data.removeProjectMember.errors.map(it => it.code).join(', ')}</>
	}

	return (
		<div>
			<TitleBar actions={<PageLinkButton to="tenantInviteUser">Add user</PageLinkButton>}>Users in project</TitleBar>
			<Table>
				{query.data.project.members.map(member => (
					<Table.Row>
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
							<ButtonGroup>
								<PageLinkButton
									distinction="outlined"
									to={() => ({ name: 'tenantEditUser', params: { id: member.identity.id } })}
								>
									Add role
								</PageLinkButton>
								<Button distinction="outlined" onClick={() => removeMember(member.identity.id)}>
									Revoke access
								</Button>
							</ButtonGroup>
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
