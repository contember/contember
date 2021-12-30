import { Box, BoxSection, Button, FieldContainer, Icon, Select, SelectOption } from '@contember/ui'
import { ComponentType, Dispatch, FC, SetStateAction, useCallback } from 'react'
import { useListRolesQuery } from '../../queries'
import { Membership } from '../../types'
import { QueryLoader } from '../QueryLoader'
import { VariableSelector } from './VariableSelector'

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

export interface EditMembershipProps {
	project: string
	memberships: (Membership | undefined)[]
	setMemberships: Dispatch<SetStateAction<(Membership | undefined)[]>>
	rolesConfig?: RolesConfig
}

export const EditMembership: FC<EditMembershipProps> = ({ project, memberships, setMemberships, rolesConfig }) => {
	const { state: roleDefinitionState } = useListRolesQuery(project)

	const addMembership = useCallback(() => {
		setMemberships(memberships => [...memberships, undefined])
	}, [setMemberships])

	return (
		<QueryLoader query={roleDefinitionState}>
			{({ query }) => {
				const roleDefinitions = query.data.project.roles
				const rolesToShow = rolesConfig ? roleDefinitions.filter(({ name }) => name in rolesConfig) : roleDefinitions
				return (
					<>
						<Box heading={'Roles'} distinction="seamless">
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
									<BoxSection
										heading={false}
										key={membershipIndex}
										actions={<Button distinction={'seamless'} size="small" onClick={removeMembership}><Icon blueprintIcon="trash" /></Button>}
									>
										<FieldContainer label={undefined}>
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
										</FieldContainer>
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

									</BoxSection>
								)
							})}
							<BoxSection heading={undefined}>
								<Button
									distinction="seamless"
									flow="block"
									justification="justifyStart"
									onClick={addMembership}
								>
									<Icon blueprintIcon={'add'} style={{ marginRight: '0.2em' }} />
									Add role
								</Button>
							</BoxSection>
						</Box>
					</>
				)
			}}
		</QueryLoader>
	)
}
