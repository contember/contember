import { useCurrentContentGraphQlClient, useProjectSlug } from '@contember/react-client'
import { Button, ContainerSpinner, Table, TableCell, TableRow, Tag, TitleBar } from '@contember/ui'
import { FC, Fragment, memo, useCallback } from 'react'
import { PageLinkButton } from '../../components'
import { useListUsersQuery } from '../hooks'
import { RoutingLinkTarget } from '../../routing'
import { RoleRendererFactory, RoleRenderers, useRoleRenderer, Variables } from './RoleRenderer'
import { useRemoveMemberIntent } from './useRemoveMemberIntent'
import { IdentityMembership } from './IdentityMembership'
import { QueryLoader } from './QueryLoader'


export interface UsersListProps<T> {
	project: string
	children?: undefined
	createRoleRenderer?: RoleRendererFactory
	createUserEditLink: (id: string) => RoutingLinkTarget
}


export const UsersList = memo<UsersListProps<any>>(({ project, createRoleRenderer, createUserEditLink }) => {
	const { state: query, refetch: refetchUserList } = useListUsersQuery(project)
	const removeMember = useRemoveMemberIntent(project, refetchUserList)
	const RoleRenderer = useRoleRenderer(createRoleRenderer, query)

	return <QueryLoader query={query}>
		{({ query }) => !RoleRenderer ? <ContainerSpinner /> : <Table>
			{query.data.project.members.map(member => {
				return (
					<TableRow key={member.identity.id}>
						<TableCell>{member.identity.person ? member.identity.person.email : '?'}</TableCell>
						<TableCell>
							<IdentityMembership RoleRenderer={RoleRenderer} memberships={member.memberships} />
						</TableCell>
						<TableCell shrunk>
							<PageLinkButton
								size="small"
								to={createUserEditLink(member.identity.id)}
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
		</Table>}
	</QueryLoader>
})

interface UsersManagementProps<T> {
	rolesDataQuery: string
	roleRenderers: RoleRenderers<T>
}

export const UsersManagement: FC<UsersManagementProps<any>> = <T extends {}>(props: UsersManagementProps<T>) => {
	const project = useProjectSlug()
	const contentClient = useCurrentContentGraphQlClient()
	const roleRendererFactory: RoleRendererFactory = useCallback(async () => {
		const rolesData = await contentClient.sendRequest(props.rolesDataQuery)
		return ({ role, variables }) => {
			const Renderer = props.roleRenderers[role]
			if (!Renderer) {
				return <>Unknown role {role}</>
			}
			return <Renderer rolesData={rolesData} variables={variables}/>
		}
	}, [contentClient, props.roleRenderers, props.rolesDataQuery])
	if (project) {
		return <>
			<TitleBar actions={<PageLinkButton to={'tenantInviteUser'}>Add a user</PageLinkButton>}>Users in project</TitleBar>
			<UsersList
				project={project}
				createRoleRenderer={roleRendererFactory}
				createUserEditLink={id => ({ pageName: 'tenantEditUser', params: { id } })}
			/>
		</>
	}
	return null
}
