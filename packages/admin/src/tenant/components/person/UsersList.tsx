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

/**
 * @group Tenant
 */
export const UsersList = memo<UsersListProps>(({ editUserLink, ...props }) => (
	<MemberList
		{...props}
		editIdentityLink={editUserLink}
		memberType={'PERSON'}
		Identity={({ identity }) => <>{identity.person ? identity.person.email : '?'}</>}
	/>
))


export type UseRoleRendererFactoryProps<T> =
	| {
		rolesDataQuery: string
		roleRenderers?: never
	}
	| {
		rolesDataQuery?: never
		roleRenderers?: RoleRenderers<T | undefined>
	}

export const useRoleRendererFactory = <T extends {}>({ rolesDataQuery, roleRenderers }: UseRoleRendererFactoryProps<T>) => {
	const contentClient = useCurrentContentGraphQlClient()
	return useCallback<RoleRendererFactory>(async () => {
		const rolesData: T | undefined = rolesDataQuery ? await contentClient.sendRequest<T>(rolesDataQuery) : undefined
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
