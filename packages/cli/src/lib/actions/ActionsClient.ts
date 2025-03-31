import { GraphQlClient } from '@contember/graphql-client'

const createActionsApiUrl = (url: string, project: string) => {
	if (url.endsWith('/')) {
		url = url.substring(0, url.length - 1)
	}

	return url + '/actions/' + project
}
export class ActionsClient {
	constructor(private readonly apiClient: GraphQlClient) {}

	public static create(url: string, project: string, apiToken: string): ActionsClient {
		const graphqlClient = new GraphQlClient({ url: createActionsApiUrl(url, project), apiToken })
		return new ActionsClient(graphqlClient)
	}

	public async listVariables(): Promise<{ name: string; value: string }[]> {
		const query = `query {
  variables {
  	name
  	value
  }
}`
		const result = await this.apiClient.execute<{
			variables: Array<{ name: string; value: string }>
		}>(query)
		return result.variables
	}

	public async setVariables(variables: { name: string; value: string }[], mode: 'MERGE' | 'SET' | 'APPEND_ONLY_MISSING'): Promise<boolean> {
		const query = `mutation($variables: [VariableInput!]!, $mode: SetVariablesMode) {
  setVariables(args: { variables: $variables, mode: $mode }) {
	ok
  }
  }`
		const result = await this.apiClient.execute<{ setVariables: { ok: boolean } }>(query, { variables: { mode, variables } })
		return result.setVariables.ok
	}
}
