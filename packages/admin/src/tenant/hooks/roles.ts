import { useAuthedTenantQuery } from './lib'

const LIST_ROLES_QUERY = `
	query($slug: String!) {
		project: projectBySlug(slug: $slug) {
			id
			roles {
				name
				variables {
					... on RoleEntityVariableDefinition {
						name
						entityName
					}
				}
			}
		}
	}
`

interface RoleVariableDefinitionBase {
	name: string
}

interface RoleEntityVariableDefinition extends RoleVariableDefinitionBase {
	entityName: string
}

export type RoleVariableDefinition = RoleEntityVariableDefinition

export interface RoleDefinition {
	name: string
	variables: RoleVariableDefinition[]
}

interface ListRolesQueryResult {
	project: {
		id: string
		roles: RoleDefinition[]
	}
}

interface ListRolesQueryVariables {
	slug: string
}

export const useListRolesQuery = (projectSlug: string) =>
	useAuthedTenantQuery<ListRolesQueryResult, ListRolesQueryVariables>(LIST_ROLES_QUERY, { slug: projectSlug })
