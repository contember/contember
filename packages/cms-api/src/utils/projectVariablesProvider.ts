import { ProjectContainerResolver } from '../CompositionRoot'
import { ProjectVariablesResolver, RoleVariablesDefinition, VariableDefinition } from '@contember/engine-tenant-api'

export const projectVariablesResolver = (
	projectContainerResolver: ProjectContainerResolver,
): ProjectVariablesResolver => async slug => {
	const container = projectContainerResolver(slug)
	if (!container) {
		throw new Error(`Project ${slug} not found`)
	}
	const schema = await container.schemaVersionBuilder.buildSchema()
	return {
		roles: Object.entries(schema.acl.roles).reduce<RoleVariablesDefinition[]>(
			(acc, [role, def]) => [
				...acc,
				{
					name: role,
					variables: Object.entries(def.variables).reduce<VariableDefinition[]>(
						(acc, [name, def]) => [...acc, { name, ...def } as VariableDefinition],
						[],
					),
				} as RoleVariablesDefinition,
			],
			[],
		),
	}
}
