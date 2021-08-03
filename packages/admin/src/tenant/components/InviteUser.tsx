import { getTenantErrorMessage } from '@contember/client'
import { useProjectSlug } from '@contember/react-client'
import {
	Box,
	Button,
	ContainerSpinner,
	FormGroup,
	Heading,
	Select,
	SelectOption,
	TextInput,
	TitleBar,
} from '@contember/ui'
import { ComponentType, Dispatch, FC, memo, SetStateAction, useCallback, useEffect, useState } from 'react'
import { NavigateBackButton } from '../../components/pageRouting'
import {
	RoleVariableDefinition,
	useAddToast,
	useInvite,
	useListRolesQuery,
	usePageLink,
	useUpdateProjectMembership,
} from '../hooks'
import { useProjectMembershipsQuery } from '../hooks/projectMemberships'

interface VariableConfig {
	render: ComponentType<{ value: string[]; onChange: (newValues: string[]) => void }>
}

type VariablesConfig = {
	[K in string]?: VariableConfig
}

interface RoleConfig {
	name: string
	variables: VariablesConfig
}

export type RolesConfig = {
	[K in string]?: RoleConfig
}

interface Membership {
	role: string
	variables: {
		name: string
		values: string[]
	}[]
}

const VariableSelector: FC<{
	rolesConfig: RolesConfig
	membership: Membership
	variable: RoleVariableDefinition
	onChange: (newMembership: Membership) => void
}> = ({ rolesConfig, membership, variable, onChange }) => {
	const innerOnChange = useCallback(
		(newValues: string[]) => {
			const newMembership: Membership = {
				...membership,
				variables: [
					...membership.variables.filter(membershipVariable => membershipVariable.name !== variable.name),
					{
						name: variable.name,
						values: newValues,
					},
				],
			}
			onChange(newMembership)
		},
		[membership, onChange, variable.name],
	)

	const roleConfig = rolesConfig[membership.role]
	const variableConfig = roleConfig && roleConfig.variables[variable.name]
	if (variableConfig === undefined) {
		return <>Unknown variable</>
	}
	const Component = variableConfig.render
	const variableInMembership = membership.variables.find(
		membershipVariable => membershipVariable.name === variable.name,
	)
	const values = variableInMembership !== undefined ? variableInMembership.values : []
	return <Component value={values} onChange={innerOnChange} />
}

interface SubmitState {
	loading: boolean
	error: undefined | string
	errorEmail: undefined | string
	success: boolean
}

interface EditUserMembershipProps {
	project: string
	memberships: (Membership | undefined)[]
	email?: string
	setMemberships: Dispatch<SetStateAction<(Membership | undefined)[]>>
	rolesConfig: RolesConfig
	setEmail?: (newEmail: string) => void
	submit: () => void
	submitState?: SubmitState
}

const EditUserMembership: FC<EditUserMembershipProps> = ({
	project,
	memberships,
	email,
	setMemberships,
	rolesConfig,
	setEmail,
	submit,
	submitState,
}) => {
	const { state: roleDefinitionState } = useListRolesQuery(project)

	const addMembership = useCallback(() => {
		setMemberships(memberships => [...memberships, undefined])
	}, [setMemberships])

	if ((submitState && submitState.loading) || roleDefinitionState.loading) {
		return <ContainerSpinner />
	}

	if (submitState && submitState.success) {
		return <>User's roles are changed.</>
	}

	if (roleDefinitionState.finished && roleDefinitionState.error) {
		return <>Error loading roles</>
	}

	const roleDefinitions = roleDefinitionState.data.project.roles
	const rolesToShow = roleDefinitions.filter(({ name }) => name in rolesConfig)
	const editing = email === undefined

	return (
		<>
			<TitleBar navigation={<NavigateBackButton to="tenantUsers">Back to list of users</NavigateBackButton>}>
				{editing ? 'Edit user' : 'Invite user'}
			</TitleBar>
			<Box>
				{submitState && submitState.error && <>Error: {submitState.error}</>}
				{email !== undefined && (
					<FormGroup
						label="E-mail"
						errors={submitState && submitState.errorEmail ? [{ message: submitState.errorEmail }] : undefined}
					>
						<TextInput
							validationState={submitState && submitState.errorEmail ? 'invalid' : 'default'}
							readOnly={setEmail === undefined}
							value={email}
							onChange={e => setEmail && setEmail(e.target.value)}
							allowNewlines={false}
						/>
					</FormGroup>
				)}
				<Heading depth={2} size="small" style={{ margin: '0.83em 0' }}>
					Roles
				</Heading>
				<div>
					{memberships.map((membership, membershipIndex) => {
						const roleDefinition = membership && roleDefinitions.find(def => def.name === membership.role)

						const updateMembership = (newMembership: Membership) => {
							setMemberships(memberships => {
								const newMemberships = [...memberships]
								newMemberships[membershipIndex] = newMembership
								return newMemberships
							})
						}

						const removeMembership = () => {
							setMemberships(memberships => {
								return memberships.slice(0, membershipIndex).concat(memberships.slice(membershipIndex + 1))
							})
						}

						return (
							<Box key={membershipIndex}>
								<FormGroup label="Role">
									<Select
										onChange={e => {
											const newRole = e.target.value
											if (!membership || newRole !== membership.role) {
												updateMembership({ role: newRole, variables: [] })
											}
										}}
										options={[
											{ value: -1, label: 'Select role', disabled: true },
											...rolesToShow.map(({ name: roleName }): SelectOption => {
												const otherIndex = memberships.findIndex(mem => mem && mem.role === roleName)
												const enabled = otherIndex === -1 || otherIndex === membershipIndex
												return {
													value: roleName,
													label: rolesConfig[roleName]!.name,
													disabled: !enabled,
												}
											}),
										]}
										value={membership === undefined ? -1 : membership.role}
									/>
								</FormGroup>
								{roleDefinition &&
									membership &&
									roleDefinition.variables.map(variable => (
										<VariableSelector
											key={variable.name}
											rolesConfig={rolesConfig}
											membership={membership}
											variable={variable}
											onChange={newMembership => {
												updateMembership(newMembership)
											}}
										/>
									))}
								<Button size="small" onClick={removeMembership}>
									Remove role
								</Button>
							</Box>
						)
					})}
					<Button distinction="seamless" onClick={addMembership}>
						Add role
					</Button>
				</div>
				<Button intent="primary" size="large" onClick={submit}>
					{editing ? 'Save' : 'Invite'}
				</Button>
			</Box>
		</>
	)
}

export const InviteUser: FC<{ project: string; rolesConfig: RolesConfig }> = ({ project, rolesConfig }) => {
	const [email, setEmailInner] = useState('')
	const { goTo: goToUsersList } = usePageLink('tenantUsers')
	const addToast = useAddToast()
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
			goToUsersList()
			addToast({
				type: 'success',
				message: `User has been invited to this project and credentials have been sent to the given email.`,
			})
		}
	}, [addToast, email, goToUsersList, invite, memberships])

	const props: EditUserMembershipProps = {
		project: project,
		rolesConfig: rolesConfig,
		memberships: memberships,
		setMemberships: setMemberships,
		email: email,
		setEmail: setEmail,
		submit: submit,
		submitState,
	}

	return <EditUserMembership {...props} />
}

export const EditUser: FC<{ project: string; rolesConfig: RolesConfig; identityId: string }> = ({
	project,
	rolesConfig,
	identityId,
}) => {
	const { state: previousMembershipsState } = useProjectMembershipsQuery(project, identityId)
	const [memberships, setMemberships] = useState<(Membership | undefined)[]>([undefined])

	const [updateMembership, updateMembershipElement] = useUpdateProjectMembership()
	const submitState: SubmitState | undefined = {
		loading: updateMembershipElement.loading,
		success:
			updateMembershipElement.finished &&
			!updateMembershipElement.error &&
			updateMembershipElement.data.updateProjectMember.ok,
		errorEmail: undefined,
		error: updateMembershipElement.error
			? 'Unable to submit'
			: updateMembershipElement.finished && !updateMembershipElement.data.updateProjectMember.ok
			? updateMembershipElement.data.updateProjectMember.errors.map(it => getTenantErrorMessage(it.code)).join(', ')
			: undefined,
	}

	useEffect(() => {
		setMemberships(currentMemberships => {
			if (
				currentMemberships.every(it => it === undefined) &&
				previousMembershipsState.finished &&
				!previousMembershipsState.error
			) {
				return previousMembershipsState.data.memberships
			}
			return currentMemberships
		})
	}, [previousMembershipsState.data, previousMembershipsState.error, previousMembershipsState.finished])

	const { goTo: goToUsersList } = usePageLink('tenantUsers')
	const addToast = useAddToast()

	const submit = useCallback(async () => {
		const membershipsToSave = memberships.filter((it: Membership | undefined): it is Membership => it !== undefined)
		if (membershipsToSave.length === 0) {
			return
		}
		const result = await updateMembership(project, identityId, membershipsToSave)
		if (result.updateProjectMember.ok) {
			goToUsersList()
			addToast({
				type: 'success',
				message: `Updated user's roles successfully.`,
			})
		}
	}, [addToast, goToUsersList, identityId, memberships, project, updateMembership])

	const props: EditUserMembershipProps = {
		project: project,
		rolesConfig: rolesConfig,
		memberships: memberships,
		setMemberships: setMemberships,
		email: undefined,
		setEmail: undefined,
		submit: submit,
		submitState,
	}

	return <EditUserMembership {...props} />
}

export const InviteUserToProject: FC<{ rolesConfig: RolesConfig }> = memo(({ rolesConfig }) => {
	const project = useProjectSlug()
	if (!project) {
		return <>Not in project.</>
	}
	return <InviteUser project={project} rolesConfig={rolesConfig} />
})

export const EditUserInProject: FC<{ rolesConfig: RolesConfig; identityId: string }> = memo(
	({ rolesConfig, identityId }) => {
		const project = useProjectSlug()
		if (!project) {
			return <>Not in project.</>
		}
		return <EditUser project={project} rolesConfig={rolesConfig} identityId={identityId} />
	},
)
