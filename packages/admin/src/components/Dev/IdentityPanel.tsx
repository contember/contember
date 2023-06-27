import { useProjectSlug, useSessionTokenWithMeta, useSetSessionToken } from '@contember/react-client'
import {
	Button,
	ButtonGroup,
	DevPanel,
	EmailInput,
	FieldContainer,
	Stack,
	Table,
	TableCell,
	TableHeaderCell,
	TableRow,
	useDialog,
	useShowToast,
} from '@contember/ui'
import { UserCircleIcon } from 'lucide-react'
import { FC, SyntheticEvent, useCallback, useState } from 'react'
import { EditMembership, GQLVariable, Membership, useCreateApiKey, useSingleTenantMutation } from '../../tenant'
import { useOptionalIdentity } from '../Identity'
import { LogoutLink } from '../LogoutLink'

export const IdentityPanel = () => {
	const identity = useOptionalIdentity()
	const sessionToken = useSessionTokenWithMeta()

	const dialog = useDialog()
	const openSwitchRole = useCallback(() => {
		dialog.openDialog({
			heading: 'Login as...',
			content: () => <LoginAsRole />,
		})
	}, [dialog])
	const openLoginEmail = useCallback(() => {
		dialog.openDialog({
			heading: 'Login by email',
			content: () => <LoginWithEmail />,
		})
	}, [dialog])

	return (
		<DevPanel icon={<UserCircleIcon />} heading="Identity">
			{identity ? <>
				<Stack direction={'vertical'}>
					<ButtonGroup>
						<Button onClick={openSwitchRole}>Switch role</Button>
						<Button onClick={openLoginEmail}>Login with email</Button>
						{sessionToken.source === 'localstorage' && <LogoutLink Component={Button}>Logout</LogoutLink>}
					</ButtonGroup>
					<Table>
						<TableRow>
							<TableHeaderCell>Identity ID</TableHeaderCell>
							<TableCell>{identity.id}</TableCell>
						</TableRow>
						<TableRow>
							<TableHeaderCell>Person ID</TableHeaderCell>
							<TableCell>{identity.person ? identity.person.id : <i>Not a person</i>}</TableCell>
						</TableRow>
						<TableRow>
							<TableHeaderCell>Token</TableHeaderCell>
							<TableCell>
								<span>{sessionToken.token}</span><br />
								<span style={{
									color: '#999',
									fontSize: '0.7rem',
								}}>{sessionToken.source === 'props' ? 'stored in env' : 'stored in a local storage'}</span>
							</TableCell>
						</TableRow>
						<TableRow>
							<TableHeaderCell>E-mail</TableHeaderCell>
							<TableCell>{identity.person ? identity.person.email : <i>Not a person</i>}</TableCell>
						</TableRow>
						<TableRow>
							<TableHeaderCell>Project access</TableHeaderCell>
							<TableCell>
								<ul>
									{identity.projects.map(it => <li key={it.slug}>
										<strong>{it.slug}</strong> ({it.roles.join(', ')})
									</li>)}
								</ul>
							</TableCell>
						</TableRow>
					</Table>

				</Stack>
			</> : <>
				Not logged in
			</>}
		</DevPanel>
	)
}

const LoginAsRole: FC = ({}) => {
	const addToast = useShowToast()
	const [isSubmitting, setSubmitting] = useState(false)
	const [memberships, setMemberships] = useState<(Membership | undefined)[]>([undefined])
	const projectSlug = useProjectSlug()!
	const createApiKey = useCreateApiKey()
	const sessionToken = useSessionTokenWithMeta()

	const setSessionToken = useSetSessionToken()
	const submit = useCallback(
		async (e: SyntheticEvent) => {
			e.preventDefault()
			setSubmitting(true)
			const membershipsToSave = memberships.filter((it: Membership | undefined): it is Membership => it !== undefined)
			const response = await createApiKey({
				description: 'Created from panel',
				memberships: membershipsToSave,
				projectSlug: projectSlug!,
			}, {
				apiTokenOverride: sessionToken.propsToken,
			})
			setSubmitting(false)
			if (!response.ok) {
				switch (response.error.code) {
					case 'INVALID_MEMBERSHIP':
						return addToast({ message: `Invalid membership definition`, type: 'error' })
					case 'PROJECT_NOT_FOUND':
						return addToast({ message: `Project not found`, type: 'error' })
				}
			} else {
				setSessionToken(response.result.apiKey.token)
			}
		},
		[memberships, createApiKey, projectSlug, sessionToken.propsToken, addToast, setSessionToken],
	)

	const editUserMembershipProps = { project: projectSlug, memberships, setMemberships }

	return (
		<form onSubmit={submit}>
			<Stack direction="vertical" gap="large">
				<EditMembership {...editUserMembershipProps} />

				<Button distinction="primary" size="large" type="submit" disabled={isSubmitting}>
					Login
				</Button>
			</Stack>
		</form>
	)
}


const createSessionKeyVariables = {
	email: GQLVariable.Required(GQLVariable.String),
}

const useCreateSessionToken = () => {
	return useSingleTenantMutation<
		{ token: string },
		'UNKNOWN_EMAIL',
		typeof createSessionKeyVariables
	>(`createSessionToken(email: $email) {
		ok
		error {
			code
		}
		result {
			token
		}
	}`, createSessionKeyVariables)

}

const LoginWithEmail = () => {
	const [email, setEmail] = useState('')
	const sessionToken = useSessionTokenWithMeta()
	const addToast = useShowToast()
	const [isSubmitting, setSubmitting] = useState(false)
	const setSessionToken = useSetSessionToken()
	const createSessionToken = useCreateSessionToken()

	const submit = useCallback(async (e: SyntheticEvent) => {
		e.preventDefault()

		setSubmitting(true)
		const response = await createSessionToken({
			email,
		}, {
			apiTokenOverride: sessionToken.propsToken,
		})
		setSubmitting(false)

		if (!response.ok) {
			switch (response.error.code) {
				case 'UNKNOWN_EMAIL':
					return addToast({ message: 'Person with given email not found.', type: 'error' })
			}
		} else {
			setSessionToken(response.result.token)
		}
	}, [addToast, createSessionToken, email, sessionToken.propsToken, setSessionToken])

	return <>
		<form onSubmit={submit}>
			<Stack direction={'vertical'}>
				<FieldContainer label={'E-mail'}>
					<EmailInput value={email} onChange={e => setEmail(e as string)} notNull />
				</FieldContainer>
				<Button size="large" type="submit" disabled={isSubmitting}>
					Login
				</Button>
			</Stack>
		</form>
	</>
}
