import { useCurrentContentGraphQlClient } from '@contember/react-client'
import { memo, useCallback } from 'react'
import { RoutingLinkTarget } from '../../../routing'
import { MemberList, RoleRendererFactory, RoleRenderers } from '../member'

export interface UsersListProps {
	project: string
	children?: undefined
	createRoleRenderer?: RoleRendererFactory
	editUserLink: RoutingLinkTarget
}

export const UsersList = memo<UsersListProps>(({ editUserLink, ...props }) => (
	<MemberList
		{...props}
		editIdentityLink={editUserLink}
		memberType={'PERSON'}
		Identity={({ identity }) => <>{identity.person ? identity.person.email : '?'}</>}
	/>
))


export interface UseRoleRendererFactoryProps<T> {
	rolesDataQuery?: string
	roleRenderers?: RoleRenderers<T>
}

export const useRoleRendererFactory = <T extends {}>({ rolesDataQuery, roleRenderers }: UseRoleRendererFactoryProps<T>) => {
	const contentClient = useCurrentContentGraphQlClient()
	return useCallback<RoleRendererFactory>(async () => {
		const rolesData = rolesDataQuery ? await contentClient.sendRequest(rolesDataQuery) : undefined
		return ({ role, variables }) => {
			if (!roleRenderers) {
				return <>{role}</>
			}
			const Renderer = roleRenderers?.[role]
			if (!Renderer) {
				return <>Unknown role {role}</>
			}
			return <Renderer rolesData={rolesData} variables={variables} />
		}
	}, [contentClient, roleRenderers, rolesDataQuery])
}
