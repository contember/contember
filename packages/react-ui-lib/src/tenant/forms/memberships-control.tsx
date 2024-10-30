import { MembershipInput } from '@contember/graphql-client-tenant'
import { dict } from '../../dict'
import { Button } from '../../ui/button'
import { PlusIcon, XIcon } from 'lucide-react'
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
			{remainingRoles.length ? <div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" className="flex gap-2"><PlusIcon className="w-4 h-4"/>{dict.tenant.invite.addRole}</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{remainingRoles.map(role => <DropdownMenuItem
							key={role}
							onClick={() => setMemberships([...memberships, {
								role: role,
								variables: [],
							}])}
						>{roles?.[role].label}</DropdownMenuItem>)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div> : null}
			{memberships.map(membership => {
				const role = roles?.[membership.role]
				return (
					<div key={membership.role} className="border rounded px-4 py-2">
						<div className="flex justify-between items-center">
							<h2 className="font-semibold">{role?.label ?? membership.role}</h2>
							<Button
								onClick={() => setMemberships(memberships.filter(it => it.role !== membership.role))}
								variant="ghost"
								type="button"
							>
								<XIcon className="w-4 h-4"/>
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
												}}
											/>
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
