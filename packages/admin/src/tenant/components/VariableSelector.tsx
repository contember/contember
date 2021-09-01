import { FC, useCallback } from 'react'
import { RoleVariableDefinition } from '../hooks'
import { RolesConfig } from './EditUserMembership'

export interface Membership {
	role: string
	variables: {
		name: string
		values: string[]
	}[]
}

export const VariableSelector: FC<{
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
