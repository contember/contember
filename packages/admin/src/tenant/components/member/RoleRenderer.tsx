import { ListMembersQuery } from '../../queries'
import { ComponentType, useEffect, useState } from 'react'
import { QueryRequestState } from '../../lib'

export type RoleRendererRoleDefinition = any // todo
export type RoleRenderer = React.FC<{ role: string; variables: Variables }>
export type RoleRendererFactory = (roleDefinitions: RoleRendererRoleDefinition[]) => Promise<RoleRenderer>

export interface Variables {
	[name: string]: string[]
}

export interface RoleRenderers<T> {
	[role: string]: ComponentType<{ variables: Variables; rolesData: T }>
}


const DefaultRoleRenderer: RoleRenderer = ({ role }) => <>{role} </>

export const useRoleRenderer = (roleRendererFactory: RoleRendererFactory | undefined, query: QueryRequestState<ListMembersQuery>): RoleRenderer | undefined => {
	const [roleRenderer, setRoleRenderer] = useState<RoleRenderer>()
	useEffect(() => {
		if (!roleRendererFactory) {
			setRoleRenderer(() => DefaultRoleRenderer)
			return
		}
		if (query.state !== 'success') {
			return
		}
		(async () => {
			const renderer = await roleRendererFactory(query.data.project.roles)
			setRoleRenderer(() => renderer)
		})()
	}, [roleRendererFactory, query])
	return roleRenderer
}
