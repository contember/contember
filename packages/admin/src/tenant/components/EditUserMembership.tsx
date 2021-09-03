import { Membership, VariableSelector } from './VariableSelector'
import { ComponentType, Dispatch, FC, SetStateAction, useCallback } from 'react'
import { useListRolesQuery } from '../hooks'
import { Box, Button, ContainerSpinner, FormGroup, Heading, Select, SelectOption, TextInput } from '@contember/ui'
import { QueryLoader } from './QueryLoader'

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

export interface SubmitState {
	loading: boolean
	error: undefined | string
	errorEmail: undefined | string
	success: boolean
}

export interface EditUserMembershipProps {
	project: string
	memberships: (Membership | undefined)[]
	email?: string
	setMemberships: Dispatch<SetStateAction<(Membership | undefined)[]>>
	rolesConfig?: RolesConfig
	setEmail?: (newEmail: string) => void
	submit: () => void
	submitState?: SubmitState
}

export const EditUserMembership: FC<EditUserMembershipProps> = ({ project, memberships, email, setMemberships, rolesConfig, setEmail, submit, submitState }) => {
	const { state: roleDefinitionState } = useListRolesQuery(project)

	const addMembership = useCallback(() => {
		setMemberships(memberships => [...memberships, undefined])
	}, [setMemberships])

	if ((submitState && submitState.loading)) {
		return <ContainerSpinner />
	}

	if (submitState && submitState.success) {
		return <>User's roles are changed.</>
	}

	return <QueryLoader query={roleDefinitionState}>
		{({ query }) => {
			const roleDefinitions = query.data.project.roles
			const rolesToShow = rolesConfig ? roleDefinitions.filter(({ name }) => name in rolesConfig) : roleDefinitions
			const editing = email === undefined

			return (
				<>
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
															label: rolesConfig?.[roleName]?.name ?? roleName,
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
				</>)
		}}
	</QueryLoader>
}
