import { useProjectSlug } from '@contember/react-client'
import { Heading, LayoutPage } from '@contember/ui'
import { LinkButton, RoutingLinkTarget } from '../../../routing'
import { UseRoleRendererFactoryProps, UsersList, useRoleRendererFactory } from '../person'
import { createNotInProjectError } from './errors'

export type UserListPageProps<T> =
	& UseRoleRendererFactoryProps<T>
	& {
		addUserLink?: RoutingLinkTarget
		editUserLink?: RoutingLinkTarget
	}

/**
 * @group Tenant
 */
export const UserListPage = <T extends {}>(props: UserListPageProps<T>) => {
	const project = useProjectSlug()
	const roleRendererFactory = useRoleRendererFactory(props)
	if (!project) {
		throw createNotInProjectError()
	}
	return (
		<LayoutPage
			actions={<LinkButton to={props.addUserLink ?? 'tenantInviteUser'}>Add a user</LinkButton>}
			title={<Heading depth={1}>Users</Heading>}
		>
			<UsersList
				project={project}
				createRoleRenderer={roleRendererFactory}
				editUserLink={props.editUserLink ?? `tenantEditUser(id: $identityId)`}
			/>
		</LayoutPage>
	)
}

/**
 * @deprecated use UserListPage
 */
export const UsersManagement = UserListPage
