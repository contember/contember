import { Box, Button, Divider, FieldContainer, Icon, Select, SelectOption, Stack } from '@contember/ui'
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
					<FieldContainer label={'Roles'} useLabelElement={false}>
						<Stack direction="vertical" gap="small">
							{memberships.map((membership, membershipIndex) => {
								const roleDefinition = membership && roleDefinitions.find(def => def.name === membership.role)
								const variablesToShow = (roleDefinition && roleDefinition.variables.filter(it => 'entityName' in it)) ?? []

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
									<Box key={membershipIndex} padding="no-padding">
										<Stack align="center" direction="horizontal" gap="none">
											<Select
												required
												distinction="seamless-with-padding"
												onChange={role => {
													if (typeof role === 'string' && (!membership || role !== membership.role)) {
														updateMembership({ role, variables: [] })
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
												placeholder="Select role"
												value={membership === undefined ? -1 : membership.role}
											/>
											<Divider gap="none" />
											<Button
												distinction="seamless"
												flow="squarish"
												onClick={removeMembership}
											>
												<Icon blueprintIcon="trash" />
											</Button>
										</Stack>

										{variablesToShow.length > 0 && membership && <>
											<Divider gap="none" />
											<Box distinction="seamless">
												<Stack direction="vertical">
													{variablesToShow.map(variable => (
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
													</Stack>
												</Box>
											</>
										}
									</Box>
								)
							})}

							<Button
								distinction="seamless"
								flow="block"
								justification="justifyStart"
								onClick={addMembership}
							>
								<Icon blueprintIcon={'add'} style={{ marginRight: '0.2em' }} />
								Add role
							</Button>
						</Stack>
					</FieldContainer>
				)
			}}
		</QueryLoader>
	)
}
