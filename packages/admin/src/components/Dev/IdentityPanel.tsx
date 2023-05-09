import React, { FC, SyntheticEvent, useCallback, useState } from 'react'
import {
	Button,
	ButtonGroup,
	DevPanel,
	Icon,
	Stack,
	Table,
	TableCell,
	TableHeaderCell,
	TableRow,
	useDialog,
	useShowToast,
} from '@contember/ui'
import { useOptionalIdentity } from '../Identity'
import { useProjectSlug, useSessionTokenWithMeta, useSetSessionToken } from '@contember/react-client'
import { LogoutLink } from '../LogoutLink'
import { EditMembership, Membership, useCreateApiKey } from '../../tenant'

export const IdentityPanel = () => {
	const identity = useOptionalIdentity()
	const sessionToken = useSessionTokenWithMeta()

	const dialog = useDialog()
	const open = useCallback(() => {
		dialog.openDialog({
			heading: 'Login as...',
			content: () => <LoginAsRole />,
		})
	}, [dialog])

	return (
		<DevPanel heading={<><Icon blueprintIcon={'user'} /> Identity</>}>
			{identity ? <>
				<Stack direction={'vertical'}>
					<ButtonGroup>
						<Button onClick={open}>Switch role</Button>
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
