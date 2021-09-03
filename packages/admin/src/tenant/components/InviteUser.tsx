import { getTenantErrorMessage } from '@contember/client'
import { useProjectSlug } from '@contember/react-client'
import { FC, memo, useCallback, useState } from 'react'
import { useRedirect, useShowToast } from '../../components'
import { useInvite } from '../hooks'
import { Membership } from './VariableSelector'
import { EditUserMembership, EditUserMembershipProps, RolesConfig, SubmitState } from './EditUserMembership'
import { RoutingLinkTarget } from '../../routing'


interface InviteUserProps {
	project: string
	rolesConfig?: RolesConfig
	userListLink: RoutingLinkTarget
}
export const InviteUser: FC<InviteUserProps> = ({ project, rolesConfig, userListLink }) => {
	const [email, setEmailInner] = useState('')
	const redirect = useRedirect()
	const addToast = useShowToast()
	const [emailNotValidError, setEmailNotValidError] = useState(false)
	const setEmail = useCallback((email: string) => {
		setEmailNotValidError(false)
		setEmailInner(email)
	}, [])
	const [memberships, setMemberships] = useState<(Membership | undefined)[]>([undefined])

	const [invite, inviteState] = useInvite(project)
	const submitState: SubmitState | undefined = {
		loading: inviteState.loading,
		success: inviteState.finished && !inviteState.error && inviteState.data.invite.ok,
		errorEmail: emailNotValidError ? 'Email is not valid.' : undefined,
		error: inviteState.error
			? 'Unable to submit'
			: inviteState.finished && !inviteState.data.invite.ok
			? inviteState.data.invite.errors.map(it => getTenantErrorMessage(it.code)).join(', ')
			: undefined,
	}

	const submit = useCallback(async () => {
		setEmailNotValidError(false)
		const membershipsToSave = memberships.filter((it: Membership | undefined): it is Membership => it !== undefined)
		if (
			email.match(
				/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
			) === null
		) {
			setEmailNotValidError(true)
			return
		}
		const inviteResult = await invite(email, membershipsToSave)
		if (inviteResult.invite.ok) {
			redirect(userListLink)
			addToast({
				type: 'success',
				message: `User has been invited to this project and credentials have been sent to the given email.`,
			})
		}
	}, [addToast, email, redirect, invite, memberships, userListLink])

	const props: EditUserMembershipProps = {
		project: project,
		rolesConfig: rolesConfig,
		memberships: memberships,
		setMemberships: setMemberships,
		email: email,
		setEmail: setEmail,
		submit: submit,
		submitState,
		userListLink,
	}

	return <EditUserMembership {...props} />
}


export const InviteUserToProject: FC<{ rolesConfig: RolesConfig }> = memo(({ rolesConfig }) => {
	const project = useProjectSlug()
	if (!project) {
		return <>Not in project.</>
	}
	return <InviteUser project={project} rolesConfig={rolesConfig} userListLink={'tenantUsers'} />
})
