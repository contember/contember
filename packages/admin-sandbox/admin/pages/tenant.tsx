import { EditUserPage, InviteUserPage, useEnvironment, UserListPage } from '@contember/admin'

export const Users = () => {
	return <UserListPage editUserLink={'tenant/edit(id: $identityId)'} addUserLink={'tenant/invite'} />
}
export const Edit = () => {
	const id = String(useEnvironment().getParameter('id'))
	return <EditUserPage identityId={id} userListLink={'tenant/users'} />
}

export const Invite = () => {
	return <InviteUserPage userListLink={'tenant/users'} />
}
