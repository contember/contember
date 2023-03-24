import { Button, FieldContainer, Stack, TextInput, useShowToast } from '@contember/ui'
import { FC, SyntheticEvent, useCallback, useRef, useState } from 'react'
import { RoutingLinkTarget, useRedirect } from '../../../routing'
import { InviteMethod, useInvite } from '../../mutations'
import { Membership } from '../../types'
import { EditMembership, RolesConfig } from '../member'

export interface InviteUserProps {
	project: string
	rolesConfig?: RolesConfig
	userListLink: RoutingLinkTarget
	method?: InviteMethod
	mailVariant?: string
}

export const InviteUser: FC<InviteUserProps> = ({ project, rolesConfig, userListLink, method, mailVariant }) => {
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
			const inviteResult = await invite({ email, memberships: membershipsToSave, projectSlug: project, method, mailVariant })
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
		[memberships, email, invite, project, method, mailVariant, addToast, redirect, userListLink],
	)

	const editUserMembershipProps = { project, rolesConfig, memberships, setMemberships }

	const emailInput = useRef<HTMLInputElement>(null)

	return (
		<form onSubmit={submit}>
			<Stack direction="vertical" gap="large">
				<FieldContainer label="E-mail" errors={emailNotValidError ? [{ message: 'Email is not valid.' }] : undefined}>
					<TextInput
						ref={emailInput}
						validationState={emailNotValidError ? 'invalid' : 'default'}
						value={email}
						onChange={useCallback((value?: string | null) => setEmail?.(value ?? ''), [setEmail])}
					/>
				</FieldContainer>

				<EditMembership {...editUserMembershipProps} />

				<Button distinction="primary" type="submit" disabled={isSubmitting}>
					Invite
				</Button>
			</Stack>
		</form>
	)
}
