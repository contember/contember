import { ProjectMembersFilter } from '@contember/graphql-client-tenant'
import * as React from 'react'
import { TableCell } from '../../ui/table'
import { dict } from '../../dict'
import { MemberList, MemberListController } from './member-list'

const filter: ProjectMembersFilter = {
	memberType: 'API_KEY',
}

export const ApiKeyList = (props: { controller?: { current?: MemberListController } }) => (
	<MemberList
		{...props}
		filter={filter}
		labels={{
			deleteConfirmation: dict.tenant.apiKeyList.deleteConfirmation,
			deleted: dict.tenant.apiKeyList.deleted,
			deleteFailed: dict.tenant.apiKeyList.deleteFailed,
		}}
		tableHeaders={[dict.tenant.apiKeyList.description]}
		tableColumns={it => <>
			<TableCell key="description">{it.identity.description ?? dict.tenant.apiKeyList.unnamed}</TableCell>
		</>}
	/>
)
