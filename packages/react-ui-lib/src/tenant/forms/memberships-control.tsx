import { MembershipInput } from '@contember/graphql-client-tenant'
import { Button } from '../../ui/button'
import { PlusIcon, TrashIcon } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown'
import { Fragment, ReactNode, useMemo } from 'react'
import { useProjectRolesDefinitionQuery, useTenantQueryLoader } from '@contember/react-client-tenant'
import { Textarea } from '../../ui/textarea'

export type VariableRendererProps = { value: readonly string[]; onChange: (newValues: readonly string[]) => void }
export type RolesConfig = {
	[K in string]: {
		label: ReactNode
		variables: {
			[K in string]: {
				label: ReactNode
				render: React.ComponentType<VariableRendererProps>
			}
		}
	}
}

export interface MembershipsControlProps {
	memberships: readonly MembershipInput[]
	setMemberships: (memberships: MembershipInput[]) => void
	roles?: RolesConfig
}

export const MembershipsControl = ({ setMemberships, memberships, roles }: MembershipsControlProps) => {
	const remainingRoles = roles ? Object.keys(roles).filter(role => !memberships.some(it => it.role === role)) : []

	return (
		<div className="flex flex-col gap-4">
			{memberships.map(membership => {
				const role = roles?.[membership.role]
				return (
					<div key={membership.role} className="border rounded p-4">
						<div className="flex justify-between">
							<h2 className="font-semibold">{role?.label ?? membership.role}</h2>
							<Button onClick={() => setMemberships(memberships.filter(it => it.role !== membership.role))} variant="destructive" type="button">
								<TrashIcon className="w-3 h-3" />
							</Button>
						</div>
						<div>
							{Object.entries(role?.variables ?? {}).map(([variableName, variableConfig]) => {
								const value = membership.variables.find(it => it.name === variableName)?.values ?? []
								const VariableComponent = variableConfig.render
								return (
									<Fragment key={variableName}>
										<h3>{variableConfig.label}</h3>
										<div>
											<VariableComponent
												key={variableName}
												value={value}
												onChange={newValues => {
													setMemberships(memberships.map(it =>
														it.role !== membership.role ? it : {
															...it,
															variables: [
																...it.variables.filter(it => it.name !== variableName),
																{ name: variableName, values: newValues },
															],
														}),
													)
												}} />
										</div>
									</Fragment>
								)
							})}
							{membership.variables.map(variable => {
								if (role?.variables[variable.name]) {
									return null
								}
								return (
									<Fragment key={variable.name}>
										<h3>{variable.name}</h3>
										<div>{variable.values.map(it => <div key={it}>{it}</div>)}</div>
									</Fragment>
								)
							})}
						</div>
					</div>
				)
			})}
			<div>
				{remainingRoles.length ? <DropdownMenu>
					<DropdownMenuTrigger>
						<Button variant="outline"><PlusIcon className="w-3 h-3" /></Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{remainingRoles.map(role => <DropdownMenuItem key={role} onClick={() => setMemberships([...memberships, { role: role, variables: [] }])}>{roles?.[role].label}</DropdownMenuItem>)}
					</DropdownMenuContent>
				</DropdownMenu> : null}
			</div>
		</div>
	)
}

export const useIntrospectionRolesConfig = (projectSlug: string): RolesConfig | undefined => {
	const [result] = useTenantQueryLoader(useProjectRolesDefinitionQuery(), { slug: projectSlug })
	return useMemo(() => {
		if (result.state !== 'success') {
			return undefined
		}
		const roles = result.data
		const rolesConfig: RolesConfig = {}
		for (const role of roles) {
			const variables: RolesConfig[string]['variables'] = {}
			for (const variable of role.variables) {
				if (variable.__typename === 'RolePredefinedVariableDefinition') {
					continue
				}
				variables[variable.name] = {
					label: variable.name,
					render: VariablesEditor,
				}
			}
			rolesConfig[role.name] = {
				label: role.name,
				variables: variables,
			}
		}
		return rolesConfig
	}, [result])
}

const VariablesEditor = ({ value, onChange }: VariableRendererProps) => {
	return <Textarea value={value.join('\n')} onChange={e => onChange(e.target.value.split('\n').filter(Boolean))} />
}
