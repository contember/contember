import { RolesConfig } from '../member'
import { NavigateBackButton, RoutingLinkTarget } from '../../../routing'
import { InviteMethod } from '../../mutations'
import { FC, memo } from 'react'
import { useProjectSlug } from '@contember/react-client'
import { LayoutPage } from '@contember/ui'
import { InviteUser } from '../person'
import { createNotInProjectError } from './errors'

export type InviteUserPageProps = {
	rolesConfig?: RolesConfig
	userListLink?: RoutingLinkTarget
	method?: InviteMethod
}

/**
 * @group Tenant
 */
export const InviteUserPage: FC<InviteUserPageProps> = memo(({ rolesConfig, userListLink = 'tenantUsers', method }) => {
	const project = useProjectSlug()
	if (!project) {
		throw createNotInProjectError()
	}
	return (
		<LayoutPage
			title="Invite user"
			navigation={<NavigateBackButton to={userListLink}>Back to list of users</NavigateBackButton>}
		>
			<InviteUser project={project} rolesConfig={rolesConfig} userListLink={userListLink} method={method} />
		</LayoutPage>
	)
})


/**
 * @deprecated use InviteUserPage
 */
export const InviteUserToProject = InviteUserPage
