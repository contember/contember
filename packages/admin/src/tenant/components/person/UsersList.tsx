import { useCurrentContentGraphQlClient, useProjectSlug } from '@contember/react-client'
import { LayoutPage } from '@contember/ui'
import { FC, memo, useCallback } from 'react'
import { LinkButton, RoutingLinkTarget } from '../../../routing'
import { MemberList, RoleRendererFactory, RoleRenderers } from '../member'

export interface UsersListProps {
	project: string
	children?: undefined
	createRoleRenderer?: RoleRendererFactory
	createUserEditLink: (id: string) => RoutingLinkTarget
}

export const UsersList = memo<UsersListProps>(({ createUserEditLink, ...props }) => (
	<MemberList
		{...props}
		createEditIdentityLink={createUserEditLink}
		memberType={'PERSON'}
		Identity={({ identity }) => <>{identity.person ? identity.person.email : '?'}</>}
	/>
))

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
			return <Renderer rolesData={rolesData} variables={variables} />
		}
	}, [contentClient, props.roleRenderers, props.rolesDataQuery])
	if (project) {
		return (
			<LayoutPage
				actions={<LinkButton to={'tenantInviteUser'}>Add a user</LinkButton>}
				title="Users in project"
			>
				<UsersList
					project={project}
					createRoleRenderer={roleRendererFactory}
					createUserEditLink={id => ({ pageName: 'tenantEditUser', parameters: { id } })}
				/>
			</LayoutPage>
		)
	}
	return null
}
