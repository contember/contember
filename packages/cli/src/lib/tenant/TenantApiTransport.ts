import { CliError, ExitCode } from '@contember/cli-common'
import { GraphQlClient } from '@contember/graphql-client'
import { Fetcher, TextWriter, util } from 'graphql-ts-client-api'
import { toTransportError } from '../errors/TransportError.js'

/** Normalizes any endpoint the user may have configured into the tenant GraphQL endpoint. */
export const createTenantApiUrl = (url: string): string => {
	if (url.endsWith('/')) {
		url = url.substring(0, url.length - 1)
	}
	if (url.endsWith('/tenant')) {
		return url
	}
	return url + '/tenant'
}

/** The shape every tenant `*Response` mutation payload shares. */
export interface TenantMutationResult {
	readonly ok: boolean
	readonly error?: {
		readonly code: string
		readonly developerMessage?: string | null
		readonly weakPasswordReasons?: readonly unknown[] | null
		readonly recommendedAction?: unknown
	} | null
}

/**
 * The single transport every tenant domain client is built on.
 *
 * Usage — see `clients/README.md`:
 *
 * ```ts
 * const personsFetcher = query$.persons(person$$)                       // built once, fetchers are immutable
 * const result = await this.transport.exec(personsFetcher, { limit })   // variables are typed by the fetcher
 * this.transport.assertOk(result.disablePerson, 'disablePerson')        // mutation payloads only
 * ```
 *
 * Everything thrown out of here is a {@link CliError} with a stable `code` and the `ExitCode`
 * matching the taxonomy, so no command has to translate tenant errors itself.
 */
export class TenantApiTransport {
	constructor(
		private readonly apiClient: GraphQlClient,
	) {
	}

	public static create(url: string, apiToken: string): TenantApiTransport {
		return new TenantApiTransport(new GraphQlClient({ url: createTenantApiUrl(url), apiToken }))
	}

	public get apiUrl(): string {
		return this.apiClient.apiUrl
	}

	/** Runs a `graphql-ts-client-api` fetcher as a query or a mutation, depending on the fetcher's root type. */
	public async exec<TData extends object, TVariables extends object>(
		fetcher: Fetcher<'Query' | 'Mutation', TData, TVariables>,
		variables: TVariables,
	): Promise<TData> {
		try {
			return await this.apiClient.execute<TData>(buildRequestDocument(fetcher), { variables })
		} catch (e) {
			throw toTenantApiError(e)
		}
	}

	/** Turns a failed tenant mutation payload into a {@link CliError} carrying the tenant error code. */
	public assertOk(result: TenantMutationResult | null | undefined, operation: string): void {
		if (result?.ok === true) {
			return
		}
		throw tenantMutationError(result, operation)
	}
}

/** Builds the operation document out of a fetcher — the variable declarations are derived from its variable map. */
export const buildRequestDocument = (fetcher: Fetcher<'Query' | 'Mutation', object, object>): string => {
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
	return writer.toString()
}

export const tenantMutationError = (result: TenantMutationResult | null | undefined, operation: string): CliError => {
	const code = result?.error?.code ?? 'UNKNOWN'
	const developerMessage = result?.error?.developerMessage ?? null
	const details: Record<string, unknown> = { operation, code, developerMessage }
	const weakPasswordReasons = result?.error?.weakPasswordReasons?.filter(isWeakPasswordReason)
	if (weakPasswordReasons !== undefined && weakPasswordReasons.length > 0) {
		details.weakPasswordReasons = weakPasswordReasons
	}
	const recommendedAction = result?.error?.recommendedAction
	if (isSignUpRecommendedAction(recommendedAction)) {
		details.recommendedAction = recommendedAction
	}
	return new CliError(`${operation} failed: ${code}${developerMessage ? ` — ${developerMessage}` : ''}`, {
		code,
		exitCode: tenantErrorCodeToExitCode(code),
		details,
	})
}

const weakPasswordReasons = [
	'TOO_SHORT',
	'MISSING_UPPERCASE',
	'MISSING_LOWERCASE',
	'MISSING_DIGIT',
	'MISSING_SPECIAL',
	'INVALID_PATTERN',
	'BLACKLISTED',
	'COMPROMISED',
]

const isWeakPasswordReason = (value: unknown): value is string => typeof value === 'string' && weakPasswordReasons.includes(value)

const isSignUpRecommendedAction = (value: unknown): value is string => value === 'SIGN_IN' || value === 'RESET_PASSWORD'

/**
 * The tenant API returns a per-mutation error code enum (see `tenant.graphql`). Only the codes that are
 * not plain input errors are listed — everything unlisted falls back to {@link ExitCode.InputError}.
 */
const tenantErrorCodeExitCodes = new Map<string, ExitCode>([
	// conflicts
	['ALREADY_EXISTS', ExitCode.Conflict],
	['ALREADY_MEMBER', ExitCode.Conflict],
	['EMAIL_ALREADY_EXISTS', ExitCode.Conflict],
	['PERSON_ALREADY_EXISTS', ExitCode.Conflict],
	['PERSON_ALREADY_DISABLED', ExitCode.Conflict],

	// not found
	['NOT_FOUND', ExitCode.NotFound],
	['IDENTITY_NOT_FOUND', ExitCode.NotFound],
	['KEY_NOT_FOUND', ExitCode.NotFound],
	['PERSON_NOT_FOUND', ExitCode.NotFound],
	['PROJECT_NOT_FOUND', ExitCode.NotFound],
	['PROVIDER_NOT_FOUND', ExitCode.NotFound],
	['ROLE_NOT_FOUND', ExitCode.NotFound],
	['SESSION_NOT_FOUND', ExitCode.NotFound],
	['TEMPLATE_NOT_FOUND', ExitCode.NotFound],
	['TOKEN_NOT_FOUND', ExitCode.NotFound],
	['VARIABLE_NOT_FOUND', ExitCode.NotFound],
	['UNKNOWN_EMAIL', ExitCode.NotFound],
	['UNKNOWN_PERSON_ID', ExitCode.NotFound],
	['NOT_MEMBER', ExitCode.NotFound],

	// auth / permission
	['INVALID_CREDENTIALS', ExitCode.Forbidden],
	['PERSON_DISABLED', ExitCode.Forbidden],
	['EMAIL_NOT_VERIFIED', ExitCode.Forbidden],
	['MFA_REQUIRED', ExitCode.Forbidden],
	['MFA_ENROLLMENT_REQUIRED', ExitCode.Forbidden],
	['OTP_REQUIRED', ExitCode.Forbidden],
	['INVALID_OTP_TOKEN', ExitCode.Forbidden],
	['PASSWORDLESS_DISABLED', ExitCode.Forbidden],
	['NOT_POSSIBLE_SIGN_OUT_WITH_PERMANENT_API_KEY', ExitCode.Forbidden],

	// retryable
	['RATE_LIMITED', ExitCode.Transient],
	['RATE_LIMIT_EXCEEDED', ExitCode.Transient],

	// server-side failures the caller cannot fix by changing the input
	['INIT_ERROR', ExitCode.InternalError],
	['UNKNOWN', ExitCode.InternalError],
])

/** Maps a tenant error code onto the exit-code taxonomy. Unknown codes fall back on the naming convention. */
export const tenantErrorCodeToExitCode = (code: string): ExitCode => {
	const known = tenantErrorCodeExitCodes.get(code)
	if (known !== undefined) {
		return known
	}
	// codes added to the schema later follow the same naming, so the taxonomy holds without a CLI release
	if (code.endsWith('_NOT_FOUND')) {
		return ExitCode.NotFound
	}
	if (code.startsWith('ALREADY_') || code.includes('_ALREADY_')) {
		return ExitCode.Conflict
	}
	if (code.includes('RATE_LIMIT')) {
		return ExitCode.Transient
	}
	return ExitCode.InputError
}

/** Normalizes a transport-level failure without exposing the GraphQL request or response body. */
export const toTenantApiError = (error: unknown): CliError =>
	toTransportError(error, {
		service: 'Tenant API',
		codePrefix: 'TENANT_API',
	})
