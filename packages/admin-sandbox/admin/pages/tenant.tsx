import { EditUserPage, InviteUserPage, useEnvironment, UserListPage } from '@contember/admin'
import { Directive } from '../components/Directives'
import { Content } from '../components/Slots'

export const Users = () => {
	return (
		<>
			<Directive name="layout" content="legacy" />
			<Content>
				<UserListPage editUserLink={'tenant/edit(id: $identityId)'} addUserLink={'tenant/invite'} />
			</Content>
		</>
	)
}
export const Edit = () => {
	const id = String(useEnvironment().getParameter('id'))
	return (
		<>
			<Directive name="layout" content="legacy" />
			<Content>
				<EditUserPage identityId={id} userListLink={'tenant/users'} />
			</Content>
		</>
	)
}

export const Invite = () => {
	return (
		<>
			<Directive name="layout" content="legacy" />
			<Content>
				<InviteUserPage userListLink={'tenant/users'} />
			</Content>
		</>
	)
}
