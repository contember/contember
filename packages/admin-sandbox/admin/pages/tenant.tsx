import { EditUserPage, InviteUserPage, useEnvironment, UserListPage } from '@contember/admin'
import { Content } from '../components/Layout'
import { MetaDirective } from '../components/MetaDirectives'

export const Users = () => {
	return (
		<>
			<MetaDirective name="layout" content="legacy" />
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
			<MetaDirective name="layout" content="legacy" />
			<Content>
				<EditUserPage identityId={id} userListLink={'tenant/users'} />
			</Content>
		</>
	)
}

export const Invite = () => {
	return (
		<>
			<MetaDirective name="layout" content="legacy" />
			<Content>
				<InviteUserPage userListLink={'tenant/users'} />
			</Content>
		</>
	)
}
