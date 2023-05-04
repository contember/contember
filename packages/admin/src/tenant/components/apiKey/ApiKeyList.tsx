import { MemberList, RoleRendererFactory } from '../member'
import { RoutingLinkTarget } from '../../../routing'
import { memo } from 'react'

export interface ApiKeyListProps {
	project: string
	children?: undefined
	createRoleRenderer?: RoleRendererFactory
	editApiKeyLink: RoutingLinkTarget
}

/**
 * @group Tenant
 */
export const ApiKeyList = memo<ApiKeyListProps>(({ editApiKeyLink, ...props }) => (
	<MemberList
		{...props}
		editIdentityLink={editApiKeyLink}
		memberType={'API_KEY'}
		Identity={({ identity }) => <>{identity.description ?? 'unknown key'}</>}
	/>
))
