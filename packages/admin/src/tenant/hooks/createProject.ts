import { GQLVariable, GQLVariableType, useSingleTenantMutation } from './lib/facade'

const CREATE_PROJECT_MUTATION = `
createProject(projectSlug: $projectSlug, name: $name, config: $config, secrets: $secrets) {
	ok
	error {
		code
		developerMessage
	}
	result {
		deployerApiKey {
			id
			token
		}
	}
}
`
const ProjectSecretVariable:  GQLVariableType<{key: string, value: string}, false> = { graphQlType: 'ProjectSecret', required: false }
const createProjectVariables = {
	projectSlug: GQLVariable.Required(GQLVariable.String),
	name: GQLVariable.String,
	config: GQLVariable.Json,
	secrets: GQLVariable.List(ProjectSecretVariable),
}

export const useCreateProject = () => {
	return useSingleTenantMutation<{
		deployerApiKey: {
			id: string
			token: string
		}
	}, 'ALREADY_EXISTS' | 'INIT_ERROR', typeof createProjectVariables>(CREATE_PROJECT_MUTATION, createProjectVariables)
}
