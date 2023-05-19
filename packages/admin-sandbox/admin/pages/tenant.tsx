import { EditUserPage, InviteUserPage, useEnvironment, UserListPage } from '@contember/admin'
import { Directive } from '../components/Directives'
import { Slots } from '../components/Slots'

export const Users = () => {
	return (
		<>
			<Directive name="layout" content="default" />
			<Slots.Content>
				<UserListPage editUserLink={'tenant/edit(id: $identityId)'} addUserLink={'tenant/invite'} />
			</Slots.Content>
		</>
	)
}
export const Edit = () => {
	const id = String(useEnvironment().getParameter('id'))
	return (
		<>
			<Directive name="layout" content="default" />
			<Slots.Content>
				<EditUserPage identityId={id} userListLink={'tenant/users'} />
			</Slots.Content>
		</>
	)
}

export const Invite = () => {
	return (
		<>
			<Directive name="layout" content="default" />
			<Slots.Content>
				<InviteUserPage userListLink={'tenant/users'} />
			</Slots.Content>
		</>
	)
}
