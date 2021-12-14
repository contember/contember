import { MemberList, RoleRendererFactory } from '../member'
import { RoutingLinkTarget } from '../../../routing'
import { memo } from 'react'

export interface ApiKeyListProps {
	project: string
	children?: undefined
	createRoleRenderer?: RoleRendererFactory
	createApiKeyEditLink: (id: string) => RoutingLinkTarget
}

export const ApiKeyList = memo<ApiKeyListProps>(({ createApiKeyEditLink, ...props }) => (
	<MemberList
		{...props}
		createEditIdentityLink={createApiKeyEditLink}
		memberType={'API_KEY'}
		Identity={({ identity }) => <>{identity.description ?? 'unknown key'}</>}
	/>
))
