import { ProjectContainerResolver } from '../ProjectContainer'
import { ProjectVariablesResolver, RoleVariablesDefinition, VariableDefinition } from '@contember/engine-tenant-api'
import { SchemaVersionBuilder } from '@contember/engine-system-api'

export const projectVariablesResolver = (
	projectContainerResolver: ProjectContainerResolver,
	schemaVersionBuilder: SchemaVersionBuilder,
): ProjectVariablesResolver => async slug => {
	const container = projectContainerResolver(slug)
	if (!container) {
		return undefined
	}
	const db = container.systemDatabaseContextFactory.create(undefined)
	const schema = await schemaVersionBuilder.buildSchema(db)
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
