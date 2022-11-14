import { LinkButton, RoutingLinkTarget } from '../../../routing'
import { useRoleRendererFactory, UseRoleRendererFactoryProps, UsersList } from '../person'
import { useProjectSlug } from '@contember/react-client'
import { createNotInProjectError } from './errors'
import { LayoutPage } from '@contember/ui'

export type UserListPageProps<T> =
	& UseRoleRendererFactoryProps<T>
	& {
		addUserLink?: RoutingLinkTarget
		editUserLink?: RoutingLinkTarget
	}

export const UserListPage = <T extends {}>(props: UserListPageProps<T>) => {
	const project = useProjectSlug()
	const roleRendererFactory = useRoleRendererFactory(props)
	if (!project) {
		throw createNotInProjectError()
	}
	return (
		<LayoutPage
			actions={<LinkButton to={props.addUserLink ?? 'tenantInviteUser'}>Add a user</LinkButton>}
			title="Users in project"
		>
			<UsersList
				project={project}
				createRoleRenderer={roleRendererFactory}
				editUserLink={props.editUserLink ?? `tenantEditUser(id: $id)`}
			/>
		</LayoutPage>
	)
}

/**
 * @deprecated use UserListPage
 */
export const UsersManagement = UserListPage
