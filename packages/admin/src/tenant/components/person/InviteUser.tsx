import { useProjectSlug } from '@contember/react-client'
import { Button, FieldContainer, LayoutPage, Stack, TextInput } from '@contember/ui'
import { FC, memo, SyntheticEvent, useCallback, useState } from 'react'
import { useShowToast } from '../../../components'
import { NavigateBackButton, RoutingLinkTarget, useRedirect } from '../../../routing'
import { useInvite } from '../../mutations'
import { Membership } from '../../types'
import { EditMembership, RolesConfig } from '../member'

interface InviteUserProps {
	project: string
	rolesConfig?: RolesConfig
	userListLink: RoutingLinkTarget
}

export const InviteUser: FC<InviteUserProps> = ({ project, rolesConfig, userListLink }) => {
	const [email, setEmailInner] = useState('')
	const redirect = useRedirect()
	const addToast = useShowToast()
	const [isSubmitting, setSubmitting] = useState(false)
	const [emailNotValidError, setEmailNotValidError] = useState(false)
	const setEmail = useCallback((email: string) => {
		setEmailNotValidError(false)
		setEmailInner(email)
	}, [])
	const [memberships, setMemberships] = useState<(Membership | undefined)[]>([undefined])

	const invite = useInvite()

	const submit = useCallback(
		async (e: SyntheticEvent) => {
			e.preventDefault()
			setEmailNotValidError(false)
			setSubmitting(true)
			const membershipsToSave = memberships.filter((it: Membership | undefined): it is Membership => it !== undefined)
			if (!email.match(/^.+@.+$/)) {
				return setEmailNotValidError(true)
			}
			const inviteResult = await invite({ email, memberships: membershipsToSave, projectSlug: project })
			setSubmitting(false)
			if (inviteResult.ok) {
				addToast({
					type: 'success',
					message: `User has been invited to this project and credentials have been sent to the given email.`,
					dismiss: true,
				})
				redirect(userListLink)
			} else {
				switch (inviteResult.error.code) {
					case 'ALREADY_MEMBER':
						return addToast({ message: `User is already member `, type: 'error', dismiss: true })
					case 'INVALID_MEMBERSHIP':
						return addToast({ message: `Invalid membership definition`, type: 'error', dismiss: true })
					case 'PROJECT_NOT_FOUND':
						return addToast({ message: `Project not found`, type: 'error', dismiss: true })
				}
			}
		},
		[memberships, email, invite, project, redirect, userListLink, addToast],
	)

	const editUserMembershipProps = { project, rolesConfig, memberships, setMemberships }

	return (
		<form onSubmit={submit}>
			<Stack direction="vertical">
				<FieldContainer label="E-mail" errors={emailNotValidError ? [{ message: 'Email is not valid.' }] : undefined}>
					<TextInput
						validationState={emailNotValidError ? 'invalid' : 'default'}
						value={email}
						onChange={e => setEmail && setEmail(e.target.value)}
						allowNewlines={false}
					/>
				</FieldContainer>
				<EditMembership {...editUserMembershipProps} />
				<Button size="large" type={'submit'} disabled={isSubmitting}>
					Invite
				</Button>
			</Stack>
		</form>
	)
}

export const InviteUserToProject: FC<{ rolesConfig: RolesConfig }> = memo(({ rolesConfig }) => {
	const project = useProjectSlug()
	if (!project) {
		return <>Not in project.</>
	}
	return (
		<LayoutPage
			title="Invite user"
			navigation={<NavigateBackButton to={'tenantUsers'}>Back to list of users</NavigateBackButton>}
		>
			<InviteUser project={project} rolesConfig={rolesConfig} userListLink={'tenantUsers'} />
		</LayoutPage>
	)
})
