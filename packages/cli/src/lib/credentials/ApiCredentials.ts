import { CliError, ExitCode } from '@contember/cli-common'
import type { CredentialsProvider, CredentialsRequest } from '@contember/graphql-client'
import { githubActions, kubernetes } from '@contember/workload-identity'
import type { CliEnv } from '../env.js'
import { maskToken } from '../maskToken.js'

/** The credential of every request the CLI sends — GraphQL clients and raw `fetch` alike. */
export interface ApiCredentials extends CredentialsProvider {
	/** Human-safe description for diagnostics; never the token itself. */
	readonly description: string
	/** The configured token, `null` for a token source — only for consumers that cannot take a provider. */
	readonly staticToken: string | null
}

export const staticTokenCredentials = (token: string): ApiCredentials => ({
	description: maskToken(token),
	staticToken: token,
	authenticate: async () => ({ Authorization: `Bearer ${token}` }),
})

export type ApiTokenSource =
	| { readonly type: 'github-actions'; readonly audience: string }
	| { readonly type: 'kubernetes'; readonly path: string }

export type ApiTokenSourceFactory = (source: ApiTokenSource) => CredentialsProvider

export const createApiTokenSourceProvider: ApiTokenSourceFactory = source => {
	switch (source.type) {
		case 'github-actions':
			return githubActions({ audience: source.audience })
		case 'kubernetes':
			return kubernetes({ path: source.path })
	}
}

const KUBERNETES_PREFIX = 'kubernetes:'

/** Parses `CONTEMBER_API_TOKEN_SOURCE` / `CONTEMBER_API_TOKEN_AUDIENCE`; `undefined` when no source is configured. */
export const parseApiTokenSource = (env: Pick<CliEnv, 'apiTokenSource' | 'apiTokenAudience'>): ApiTokenSource | undefined => {
	const value = env.apiTokenSource
	if (value === undefined || value === '') {
		return undefined
	}
	if (value === 'github-actions') {
		if (env.apiTokenAudience === undefined || env.apiTokenAudience === '') {
			throw new CliError(
				'CONTEMBER_API_TOKEN_SOURCE=github-actions requires CONTEMBER_API_TOKEN_AUDIENCE, the audience of the workload identity trust.',
				{
					code: 'API_TOKEN_AUDIENCE_MISSING',
					exitCode: ExitCode.InputError,
				},
			)
		}
		return { type: 'github-actions', audience: env.apiTokenAudience }
	}
	if (value.startsWith(KUBERNETES_PREFIX) && value.length > KUBERNETES_PREFIX.length) {
		return { type: 'kubernetes', path: value.slice(KUBERNETES_PREFIX.length) }
	}
	throw new CliError('Invalid CONTEMBER_API_TOKEN_SOURCE. Use "github-actions" or "kubernetes:<path to the projected token file>".', {
		code: 'API_TOKEN_SOURCE_INVALID',
		exitCode: ExitCode.InputError,
	})
}

const describeSource = (source: ApiTokenSource): string => {
	switch (source.type) {
		case 'github-actions':
			return `github-actions token source (audience ${source.audience})`
		case 'kubernetes':
			return `kubernetes token source (${source.path})`
	}
}

const sourceFailed = (description: string, error: unknown): CliError =>
	error instanceof CliError
		? error
		: new CliError(`Obtaining a token from the ${description} failed: ${error instanceof Error ? error.message : String(error)}`, {
			code: 'API_TOKEN_SOURCE_FAILED',
			exitCode: ExitCode.InputError,
			cause: error,
		})

const sourceCredentials = (source: ApiTokenSource, sourceFactory: ApiTokenSourceFactory): ApiCredentials => {
	const description = describeSource(source)
	let provider: CredentialsProvider
	try {
		// a source checks its environment when built (e.g. githubActions without `id-token: write`)
		provider = sourceFactory(source)
	} catch (error) {
		throw sourceFailed(description, error)
	}
	return {
		description,
		staticToken: null,
		authenticate: async (request: CredentialsRequest) => {
			try {
				return await provider.authenticate(request)
			} catch (error) {
				throw sourceFailed(description, error)
			}
		},
	}
}

/**
 * The single place that decides how the CLI authenticates. A token source is built once per process,
 * so every connection shares its cached token.
 */
export class ApiCredentialsResolver {
	private sourceCredentials: ApiCredentials | undefined = undefined

	constructor(
		private readonly env: Pick<CliEnv, 'apiToken' | 'apiTokenSource' | 'apiTokenAudience'>,
		private readonly sourceFactory: ApiTokenSourceFactory = createApiTokenSourceProvider,
	) {
	}

	/**
	 * @param dsnPassword the password of the DSN the connection uses, `undefined` when it uses CONTEMBER_API_URL
	 * @returns `undefined` when neither a token nor a token source is configured
	 */
	public resolve(dsnPassword: string | undefined): ApiCredentials | undefined {
		const source = parseApiTokenSource(this.env)
		if (source === undefined) {
			const token = dsnPassword ?? this.env.apiToken
			return token ? staticTokenCredentials(token) : undefined
		}
		if (this.env.apiToken) {
			throw tokenSourceConflict('CONTEMBER_API_TOKEN')
		}
		if (dsnPassword) {
			throw tokenSourceConflict('a DSN password')
		}
		this.sourceCredentials ??= sourceCredentials(source, this.sourceFactory)
		return this.sourceCredentials
	}
}

const tokenSourceConflict = (other: string): CliError =>
	new CliError(`CONTEMBER_API_TOKEN_SOURCE replaces ${other}; set only one of them.`, {
		code: 'API_TOKEN_SOURCE_CONFLICT',
		exitCode: ExitCode.InputError,
	})
