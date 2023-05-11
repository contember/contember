import { EditIdentity, RolesConfig } from '../member'
import { NavigateBackButton, RoutingLinkTarget } from '../../../routing'
import { useProjectSlug } from '@contember/react-client'
import { FC, memo } from 'react'
import { LayoutPage } from '@contember/ui'

export type EditUserPageProps = {
	identityId: string
	rolesConfig?: RolesConfig
	userListLink?: RoutingLinkTarget
}

/**
 * @group Tenant
 */
export const EditUserPage: FC<EditUserPageProps> = memo(
	({ rolesConfig, identityId, userListLink = 'tenantUsers' }) => {
		const project = useProjectSlug()
		if (!project) {
			return <>Not in project.</>
		}
		return (
			<LayoutPage
				title="Edit user"
				navigation={<NavigateBackButton to={userListLink}>Back to list of users</NavigateBackButton>}
			>
				<EditIdentity project={project} rolesConfig={rolesConfig} identityId={identityId} userListLink={userListLink} />
			</LayoutPage>
		)
	},
)

/**
 * @deprecated EditUserInProject
 */
export const EditUserInProject = EditUserPage
