import { getTenantErrorMessage } from '@contember/client'
import { useCurrentContentGraphQlClient, useProjectSlug } from '@contember/react-client'
import { Button, ContainerSpinner, Table, TableCell, TableRow, Tag, TitleBar } from '@contember/ui'
import { ComponentType, FC, Fragment, memo, useCallback, useEffect, useState } from 'react'
import { PageLinkButton, useShowToast } from '../../components'
import { useListUsersQuery, useRemoveProjectMembership } from '../hooks'
import { RoutingLinkTarget } from '../../routing'

type RoleDefinition = any // todo
type RoleRenderer = React.FC<{ role: string, variables: Variables }>
type RoleRendererFactory = (roleDefinitions: RoleDefinition[]) => Promise<RoleRenderer>;

export interface UsersListProps<T> {
	project: string
	children?: undefined
	createRoleRenderer?: RoleRendererFactory
	createUserEditLink: (id: string) => RoutingLinkTarget
}

interface Variables {
	[name: string]: string[]
}

interface RoleRenderers<T> {
	[role: string]: ComponentType<{ variables: Variables; rolesData: T }>
}

const DefaultRoleRenderer: RoleRenderer = ({ role }) => <>{role}</>

export const UsersList = memo<UsersListProps<any>>(({ project, createRoleRenderer, createUserEditLink }) => {
	const addToast = useShowToast()
	const { state: query, refetch: refetchUserList } = useListUsersQuery(project)
	const [removeMemberInner] = useRemoveProjectMembership()
	const removeMember = useCallback(
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
	const [RoleRenderer, setRoleRenderer] = useState<RoleRenderer>()
	useEffect(() => {
		if (!createRoleRenderer) {
			setRoleRenderer(() => DefaultRoleRenderer)
			return
		}
		if (!query.finished || query.error) {
			return
		}
		(async () => {
			const renderer = await createRoleRenderer(query.data.project.roles)
			setRoleRenderer(() => renderer)
		})()
	}, [createRoleRenderer, query])

	if (query.error) {
		return <>Error loading data</>
	}

	if (query.loading || !RoleRenderer) {
		return <ContainerSpinner />
	}

	return (
		<>
			<Table>
				{query.data.project.members.map(member => {
					if (!member.identity.person) {
						return <Fragment key={member.identity.id} />
					}
					return (
						<TableRow key={member.identity.id}>
							<TableCell>{member.identity.person ? member.identity.person.email : '?'}</TableCell>
							<TableCell>
								{member.memberships.map((membership, i) => {
									const vars: Variables = {}
									for (let variable of membership.variables) {
										vars[variable.name] = variable.values
									}
									return (
										<Tag key={membership.role}>
											<RoleRenderer variables={vars} role={membership.role} />
										</Tag>
									)
								})}
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
			</Table>
		</>
	)
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
