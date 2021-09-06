import { FC, useCallback } from 'react'
import { RoleVariableDefinition } from '../hooks'
import { RolesConfig } from './EditUserMembership'
import { TextField } from '../../components'
import { TextInput } from '@contember/ui'

export interface Membership {
	role: string
	variables: {
		name: string
		values: string[]
	}[]
}

interface VariableSelectorProps {
	rolesConfig?: RolesConfig
	membership: Membership
	variable: RoleVariableDefinition
	onChange: (newMembership: Membership) => void
}
const GenericVariableEdit = ({ value, onChange }: { value: string[]; onChange: (newValues: string[]) => void }) => {
	return (
		<TextInput
			allowNewlines={true}
			value={value.join('\n')}
			onChange={e => {
				onChange(
					e.currentTarget.value
						.split('\n')
						.map(it => it.trim())
						.filter(it => !!it),
				)
			}}
		/>
	)
}

export const VariableSelector: FC<VariableSelectorProps> = ({ rolesConfig, membership, variable, onChange }) => {
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

	const roleConfig = rolesConfig?.[membership.role]
	const variableConfig = roleConfig?.variables[variable.name]
	if (roleConfig && variableConfig === undefined) {
		return <>Unknown variable</>
	}
	const Component = variableConfig?.render || GenericVariableEdit
	const variableInMembership = membership.variables.find(
		membershipVariable => membershipVariable.name === variable.name,
	)
	const values = variableInMembership !== undefined ? variableInMembership.values : []
	return <Component value={values} onChange={innerOnChange} />
}
