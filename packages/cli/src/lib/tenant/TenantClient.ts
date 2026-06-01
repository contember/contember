import { GraphQlClient } from '@contember/graphql-client'
import {
	addIDPError$$,
	addIDPResponse$$,
	addMailTemplateError$$,
	addMailTemplateResponse$$,
	type ConfigInput,
	configureError$$,
	configureResponse$$,
	createProjectResponse$$,
	createProjectResponseError$$,
	disableIDPError$$,
	disableIDPResponse$$,
	enableIDPError$$,
	enableIDPResponse$$,
	identityProvider$,
	type MailTemplate,
	mutation$,
	query$,
	updateIDPError$$,
	updateIDPResponse$$,
} from '@contember/graphql-client-tenant'
import { Fetcher, TextWriter, util } from 'graphql-ts-client-api'
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

// Fetchers are immutable and reusable, so they are built once at module load.
const createProjectFetcher = mutation$.createProject(createProjectResponse$$.error(createProjectResponseError$$))
const configureFetcher = mutation$.configure(configureResponse$$.error(configureError$$))
const identityProvidersFetcher = query$.identityProviders(identityProvider$.slug.type.disabledAt)
const addIdpFetcher = mutation$.addIDP(addIDPResponse$$.error(addIDPError$$))
const updateIdpFetcher = mutation$.updateIDP(updateIDPResponse$$.error(updateIDPError$$))
const enableIdpFetcher = mutation$.enableIDP(enableIDPResponse$$.error(enableIDPError$$))
const disableIdpFetcher = mutation$.disableIDP(disableIDPResponse$$.error(disableIDPError$$))
const addMailTemplateFetcher = mutation$.addMailTemplate(addMailTemplateResponse$$.error(addMailTemplateError$$))

export class TenantClient {
	constructor(private readonly apiClient: GraphQlClient) {}

	public static create(url: string, apiToken: string): TenantClient {
		const graphqlClient = new GraphQlClient({ url: createTenantApiUrl(url), apiToken })
		return new TenantClient(graphqlClient)
	}

	public async createProject(slug: string, ignoreExisting = false): Promise<void> {
		const result = await this.exec(createProjectFetcher, { projectSlug: slug })
		if (!result.createProject?.ok) {
			const code = result.createProject?.error?.code
			if (ignoreExisting && code === 'ALREADY_EXISTS') {
				return
			}
			throw code ?? 'UNKNOWN'
		}
	}

	public async configure(config: TenantGlobalConfig): Promise<void> {
		// `TenantGlobalConfig` widens a few fields to `| null` (the API accepts an
		// explicit null to clear/disable); the generated wire type omits that.
		const result = await this.exec(configureFetcher, { config: config as ConfigInput })
		this.assertOk(result.configure, 'configure')
	}

	public async listIdentityProviders(): Promise<RemoteIdentityProvider[]> {
		const result = await this.exec(identityProvidersFetcher, {})
		return result.identityProviders.map(it => ({
			slug: it.slug,
			type: it.type,
			disabledAt: it.disabledAt ?? null,
		}))
	}

	public async addIdp(slug: string, type: string, configuration: unknown, options?: TenantIdpOptions): Promise<void> {
		const result = await this.exec(addIdpFetcher, { identityProvider: slug, type, configuration, options })
		this.assertOk(result.addIDP, `addIDP(${slug})`)
	}

	public async updateIdp(slug: string, type: string, configuration: unknown, options?: TenantIdpOptions): Promise<void> {
		const result = await this.exec(updateIdpFetcher, {
			identityProvider: slug,
			type,
			configuration,
			options,
			mergeConfiguration: false,
		})
		this.assertOk(result.updateIDP, `updateIDP(${slug})`)
	}

	public async enableIdp(slug: string): Promise<void> {
		const result = await this.exec(enableIdpFetcher, { identityProvider: slug })
		this.assertOk(result.enableIDP, `enableIDP(${slug})`)
	}

	public async disableIdp(slug: string): Promise<void> {
		const result = await this.exec(disableIdpFetcher, { identityProvider: slug })
		this.assertOk(result.disableIDP, `disableIDP(${slug})`)
	}

	public async addMailTemplate(template: TenantMailTemplate): Promise<void> {
		const result = await this.exec(addMailTemplateFetcher, { template: template as MailTemplate })
		this.assertOk(result.addMailTemplate, `addMailTemplate(${template.type}/${template.variant ?? ''})`)
	}

	private async exec<TData extends object, TVariables extends object>(
		fetcher: Fetcher<'Query' | 'Mutation', TData, TVariables>,
		variables: TVariables,
	): Promise<TData> {
		const writer = new TextWriter()
		writer.text(fetcher.fetchableType.name.toLowerCase())
		if (fetcher.variableTypeMap.size !== 0) {
			writer.scope({ type: 'ARGUMENTS', multiLines: fetcher.variableTypeMap.size > 2, suffix: ' ' }, () => {
				util.iterateMap(fetcher.variableTypeMap, ([name, type]) => {
					writer.seperator()
					writer.text(`$${name}: ${type}`)
				})
			})
		}
		writer.text(fetcher.toString())
		writer.text(fetcher.toFragmentString())
		return this.apiClient.execute<TData>(writer.toString(), { variables })
	}

	private assertOk(result: MutationResult | undefined, operation: string): void {
		if (!result?.ok) {
			const code = result?.error?.code ?? 'UNKNOWN'
			const message = result?.error?.developerMessage
			throw `${operation} failed: ${code}${message ? ` — ${message}` : ''}`
		}
	}
}
