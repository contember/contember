import { GQLVariable, useSingleTenantMutation } from '../../lib'
import { MembershipInput } from '../membership'

const CREATE_API_KEY_MUTATION = `
createApiKey(projectSlug: $projectSlug, memberships: $memberships, description: $description) {
	ok
	error {
		code
		developerMessage
	}
	result {
		apiKey {
			id
			token
		}
	}
}
`

const createApiKeyVariables = {
	projectSlug: GQLVariable.Required(GQLVariable.String),
	description: GQLVariable.Required(GQLVariable.String),
	memberships: GQLVariable.Required(GQLVariable.List(MembershipInput)),
}

export const useCreateApiKey = () => {
	return useSingleTenantMutation<{
		apiKey: {
			id: string
			token: string
		}
	}, 'PROJECT_NOT_FOUND' | 'INVALID_MEMBERSHIP', typeof createApiKeyVariables>(CREATE_API_KEY_MUTATION, createApiKeyVariables)
}
