import { GraphQlClient } from '@contember/graphql-client'

export const createTenantApiUrl = (url: string) => {
	if (url.endsWith('/')) {
		url = url.substring(0, url.length - 1)
	}
	if (url.endsWith('/tenant')) {
		return url
	}
	return url + '/tenant'
}


export class TenantClient {
	constructor(private readonly apiClient: GraphQlClient) {}

	public static create(url: string, apiToken: string): TenantClient {
		const graphqlClient = new GraphQlClient({ url: createTenantApiUrl(url), apiToken })
		return new TenantClient(graphqlClient)
	}

	public async createProject(slug: string, ignoreExisting = false): Promise<void> {
		const query = `mutation($slug: String!) {
  createProject(projectSlug: $slug) {
    ok
    error {
      code
    }
  }
}`
		const result = await this.apiClient.execute<{
			createProject: { ok: boolean; error: { code: string } }
		}>(query, { variables: { slug } })
		if (!result.createProject.ok) {
			if (ignoreExisting && result.createProject.error.code === 'ALREADY_EXISTS') {
				return
			}
			throw result.createProject.error.code
		}
	}
}
