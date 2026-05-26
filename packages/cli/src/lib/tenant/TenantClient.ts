import { GraphQlClient } from '@contember/graphql-client'
import { TenantGlobalConfig, TenantIdpOptions, TenantMailTemplate } from './tenantConfig'

export const createTenantApiUrl = (url: string) => {
	if (url.endsWith('/')) {
		url = url.substring(0, url.length - 1)
	}
	if (url.endsWith('/tenant')) {
		return url
	}
	return url + '/tenant'
}

export interface RemoteIdentityProvider {
	slug: string
	type: string
	disabledAt: string | null
}

interface MutationResult {
	ok: boolean
	error?: { code: string; developerMessage?: string } | null
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

	public async configure(config: TenantGlobalConfig): Promise<void> {
		const query = `mutation($config: ConfigInput!) {
  configure(config: $config) {
    ok
    error { code developerMessage }
  }
}`
		const result = await this.apiClient.execute<{ configure: MutationResult }>(query, { variables: { config } })
		this.assertOk(result.configure, 'configure')
	}

	public async listIdentityProviders(): Promise<RemoteIdentityProvider[]> {
		const query = `query {
  identityProviders {
    slug
    type
    disabledAt
  }
}`
		const result = await this.apiClient.execute<{ identityProviders: RemoteIdentityProvider[] }>(query)
		return result.identityProviders
	}

	public async addIdp(slug: string, type: string, configuration: unknown, options?: TenantIdpOptions): Promise<void> {
		const query = `mutation($slug: String!, $type: String!, $configuration: Json!, $options: IDPOptions) {
  addIDP(identityProvider: $slug, type: $type, configuration: $configuration, options: $options) {
    ok
    error { code developerMessage }
  }
}`
		const result = await this.apiClient.execute<{ addIDP: MutationResult }>(query, {
			variables: { slug, type, configuration, options },
		})
		this.assertOk(result.addIDP, `addIDP(${slug})`)
	}

	public async updateIdp(slug: string, type: string, configuration: unknown, options?: TenantIdpOptions): Promise<void> {
		const query = `mutation($slug: String!, $type: String, $configuration: Json, $options: IDPOptions) {
  updateIDP(identityProvider: $slug, type: $type, configuration: $configuration, options: $options, mergeConfiguration: false) {
    ok
    error { code developerMessage }
  }
}`
		const result = await this.apiClient.execute<{ updateIDP: MutationResult }>(query, {
			variables: { slug, type, configuration, options },
		})
		this.assertOk(result.updateIDP, `updateIDP(${slug})`)
	}

	public async enableIdp(slug: string): Promise<void> {
		const query = `mutation($slug: String!) {
  enableIDP(identityProvider: $slug) {
    ok
    error { code developerMessage }
  }
}`
		const result = await this.apiClient.execute<{ enableIDP: MutationResult }>(query, { variables: { slug } })
		this.assertOk(result.enableIDP, `enableIDP(${slug})`)
	}

	public async disableIdp(slug: string): Promise<void> {
		const query = `mutation($slug: String!) {
  disableIDP(identityProvider: $slug) {
    ok
    error { code developerMessage }
  }
}`
		const result = await this.apiClient.execute<{ disableIDP: MutationResult }>(query, { variables: { slug } })
		this.assertOk(result.disableIDP, `disableIDP(${slug})`)
	}

	public async addMailTemplate(template: TenantMailTemplate): Promise<void> {
		const query = `mutation($template: MailTemplate!) {
  addMailTemplate(template: $template) {
    ok
    error { code }
  }
}`
		const result = await this.apiClient.execute<{ addMailTemplate: MutationResult }>(query, { variables: { template } })
		this.assertOk(result.addMailTemplate, `addMailTemplate(${template.type}/${template.variant ?? ''})`)
	}

	private assertOk(result: MutationResult, operation: string): void {
		if (!result.ok) {
			const code = result.error?.code ?? 'UNKNOWN'
			const message = result.error?.developerMessage
			throw `${operation} failed: ${code}${message ? ` — ${message}` : ''}`
		}
	}
}
