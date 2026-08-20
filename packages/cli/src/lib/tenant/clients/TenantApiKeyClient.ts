import {
	apiKey$$,
	apiKeyWithToken$$,
	createApiKeyError$$,
	type CreateApiKeyOptions,
	createApiKeyResponse$$,
	createApiKeyResult$,
	disableApiKeyError$$,
	disableApiKeyResponse$$,
	identity$,
	identityProjectRelation$,
	membership$,
	type MembershipInput,
	mutation$,
	project$,
	query$,
	variableEntry$$,
} from '@contember/graphql-client-tenant'
import { CliError, ExitCode } from '@contember/cli-common'
import { TenantApiTransport } from '../TenantApiTransport.js'

export interface TenantApiKey {
	id: string
	identityId: string
	description: string | null
	type: string | null
	enabled: boolean | null
	createdAt: string | null
	lastUsedAt: string | null
	expiresAt: string | null
}

export interface TenantGlobalApiKey extends TenantApiKey {
	globalRoles: string[] | null
}

export interface TenantApiKeyMembership {
	role: string
	variables: { name: string; values: string[] }[]
}

export interface TenantProjectApiKey extends TenantApiKey {
	memberships: TenantApiKeyMembership[]
}

export interface TenantApiKeyWithToken {
	id: string
	/** Null when the key was provisioned from a caller-supplied `tokenHash` — the server never had a plaintext to return. */
	token: string | null
}

export interface CreateApiKeyArgs {
	projectSlug: string
	memberships: MembershipInput[]
	description: string
	tokenHash?: string
	options?: CreateApiKeyOptions
}

export interface CreateGlobalApiKeyArgs {
	description: string
	roles?: string[]
	tokenHash?: string
	options?: CreateApiKeyOptions
}

// Fetchers are immutable and reusable, so they are built once at module load.
const globalApiKeysFetcher = query$.globalApiKeys(apiKey$$.identity(identity$.id.roles))
const projectApiKeysFetcher = query$.projectBySlug(
	project$.apiKeys(
		apiKey$$.identity(
			identity$.id.projects(
				identityProjectRelation$.project(project$.slug).memberships(membership$.role.variables(variableEntry$$)),
			),
		),
	),
)
const createApiKeyFetcher = mutation$.createApiKey(
	createApiKeyResponse$$.error(createApiKeyError$$).result(createApiKeyResult$.apiKey(apiKeyWithToken$$)),
)
const createGlobalApiKeyFetcher = mutation$.createGlobalApiKey(
	createApiKeyResponse$$.error(createApiKeyError$$).result(createApiKeyResult$.apiKey(apiKeyWithToken$$)),
)
const disableApiKeyFetcher = mutation$.disableApiKey(disableApiKeyResponse$$.error(disableApiKeyError$$))

/** API keys — global permanent keys and per-project ones. */
export class TenantApiKeyClient {
	constructor(
		private readonly transport: TenantApiTransport,
	) {
	}

	public async listGlobalApiKeys(): Promise<TenantGlobalApiKey[]> {
		const result = await this.transport.exec(globalApiKeysFetcher, {})
		return result.globalApiKeys.map(it => ({
			...toApiKey(it),
			globalRoles: it.identity.roles ? [...it.identity.roles] : null,
		}))
	}

	public async listProjectApiKeys(projectSlug: string): Promise<TenantProjectApiKey[]> {
		const result = await this.transport.exec(projectApiKeysFetcher, { slug: projectSlug })
		const project = result.projectBySlug
		if (!project) {
			throw new CliError(`Project ${projectSlug} was not found or is not visible to this token.`, {
				code: 'PROJECT_NOT_FOUND',
				exitCode: ExitCode.NotFound,
				details: { projectSlug },
			})
		}
		return project.apiKeys.map(it => ({
			...toApiKey(it),
			memberships: it.identity.projects.find(relation => relation.project.slug === projectSlug)?.memberships.map(membership => ({
				role: membership.role,
				variables: membership.variables.map(variable => ({ name: variable.name, values: [...variable.values] })),
			})) ?? [],
		}))
	}

	/** Project-scoped key. The token in the result is shown exactly once — the server does not store or re-expose it. */
	public async createApiKey(args: CreateApiKeyArgs): Promise<TenantApiKeyWithToken> {
		const operation = `createApiKey(${args.projectSlug})`
		const result = await this.transport.exec(createApiKeyFetcher, {
			projectSlug: args.projectSlug,
			memberships: args.memberships,
			description: args.description,
			tokenHash: args.tokenHash,
			options: args.options,
		})
		this.transport.assertOk(result.createApiKey, operation)
		return toApiKeyWithToken(result.createApiKey?.result?.apiKey, operation)
	}

	/** Global key, tied to no project. The token in the result is shown exactly once. */
	public async createGlobalApiKey(args: CreateGlobalApiKeyArgs): Promise<TenantApiKeyWithToken> {
		const operation = `createGlobalApiKey(${args.description})`
		const result = await this.transport.exec(createGlobalApiKeyFetcher, {
			description: args.description,
			roles: args.roles,
			tokenHash: args.tokenHash,
			options: args.options,
		})
		this.transport.assertOk(result.createGlobalApiKey, operation)
		return toApiKeyWithToken(result.createGlobalApiKey?.result?.apiKey, operation)
	}

	public async disableApiKey(id: string): Promise<void> {
		const result = await this.transport.exec(disableApiKeyFetcher, { id })
		this.transport.assertOk(result.disableApiKey, `disableApiKey(${id})`)
	}
}

const toApiKey = (it: {
	readonly id: string
	readonly identity: { readonly id: string }
	readonly description?: string
	readonly type?: string
	readonly enabled?: boolean
	readonly createdAt?: string
	readonly lastUsedAt?: string
	readonly expiresAt?: string
}): TenantApiKey => ({
	id: it.id,
	identityId: it.identity.id,
	description: it.description ?? null,
	type: it.type ?? null,
	enabled: it.enabled ?? null,
	createdAt: it.createdAt ?? null,
	lastUsedAt: it.lastUsedAt ?? null,
	expiresAt: it.expiresAt ?? null,
})

/** `assertOk` only proves `ok`/`error` are consistent — `result` is still typed optional, so this guards the actual payload. */
const toApiKeyWithToken = (apiKey: { id: string; token?: string } | undefined, operation: string): TenantApiKeyWithToken => {
	if (!apiKey) {
		throw new CliError(`${operation} reported success but returned no api key`, {
			code: 'TENANT_API_INVALID_RESPONSE',
			exitCode: ExitCode.InternalError,
		})
	}
	return { id: apiKey.id, token: apiKey.token ?? null }
}
