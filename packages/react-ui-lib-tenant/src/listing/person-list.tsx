import { ProjectMembersFilter } from '@contember/graphql-client-tenant'
import * as React from 'react'
import { TableCell } from '@contember/react-ui-lib-base'
import { dict } from '../dict.js'
import { MemberList, MemberListController } from './member-list.js'
import { RolesConfig } from '../forms/index.js'

const filter: ProjectMembersFilter = {
	memberType: 'PERSON',
}
export const PersonList = (props: { controller?: { current?: MemberListController }; roles?: RolesConfig }) => (
	<MemberList
		{...props}
		filter={filter}
		labels={{
			deleteConfirmation: dict.tenant.personList.deleteConfirmation,
			deleted: dict.tenant.personList.deleted,
			deleteFailed: dict.tenant.personList.deleteFailed,
		}}
		tableHeaders={[dict.tenant.personList.email, dict.tenant.personList.name]}
		tableColumns={it => (
			<>
				<TableCell key="email">{it.identity.person?.email ?? dict.tenant.personList.noEmail}</TableCell>
				<TableCell key="name">{it.identity.person?.name ?? dict.tenant.personList.noName}</TableCell>
			</>
		)}
	/>
)
