import { useProjectSlug } from '@contember/react-client'
import { Heading, LayoutPage } from '@contember/ui'
import { FC, memo } from 'react'
import { NavigateBackButton, RoutingLinkTarget } from '../../../routing'
import { InviteMethod } from '../../mutations'
import { RolesConfig } from '../member'
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
			title={<Heading depth={1}>Invite user</Heading>}
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
