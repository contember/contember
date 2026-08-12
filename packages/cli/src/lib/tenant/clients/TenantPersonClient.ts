import { CliError, ExitCode } from '@contember/cli-common'
import {
	addGlobalIdentityRolesError$$,
	addGlobalIdentityRolesResponse$$,
	addGlobalIdentityRolesResult$,
	changePasswordError$$,
	changePasswordResponse$$,
	changeProfileError$$,
	changeProfileResponse$$,
	createPasswordResetRequestError$$,
	createPasswordResetRequestResponse$$,
	type CreateResetPasswordRequestOptions,
	createSessionTokenError$$,
	createSessionTokenResponse$$,
	createSessionTokenResult$,
	disablePersonError$$,
	disablePersonResponse$$,
	forceSignOutPersonError$$,
	forceSignOutPersonResponse$$,
	identity$,
	identityProviderListItem$$,
	mutation$,
	person$$,
	personIdentityProvider$,
	type PersonsFilter,
	query$,
	removeGlobalIdentityRolesError$$,
	removeGlobalIdentityRolesResponse$$,
	removeGlobalIdentityRolesResult$,
	resetPersonMfaError$$,
	resetPersonMfaResponse$$,
	sessionInfo$$,
	type SignInOptions,
	signUpError$$,
	signUpResponse$$,
	signUpResult$,
} from '@contember/graphql-client-tenant'
import { TenantApiTransport } from '../TenantApiTransport.js'

export interface TenantPerson {
	id: string
	identityId: string
	email: string | null
	name: string | null
	otpEnabled: boolean
	emailOtpEnabled: boolean
	emailVerified: boolean
}

export interface TenantPersonSession {
	id: string
	createdAt: string
	expiresAt: string | null
	lastUsedAt: string | null
	lastIp: string | null
	lastUserAgent: string | null
	createdIp: string | null
	createdUserAgent: string | null
	isCurrent: boolean
	trustForwardedClientInfo: boolean
}

export interface TenantPersonIdentityProvider {
	id: string
	slug: string
	type: string
	externalIdentifier: string
	createdAt: string
}

/**
 * Everything `personById` exposes about a single person. `roles` is null when the caller may not read
 * them, and `sessions` / `identityProviders` come back empty (never an error) for the same reason.
 */
export interface TenantPersonDetail extends TenantPerson {
	passwordlessEnabled: boolean | null
	roles: string[] | null
	sessions: TenantPersonSession[]
	identityProviders: TenantPersonIdentityProvider[]
}

export interface ListPersonsArgs {
	filter?: PersonsFilter
	limit?: number
	offset?: number
}

export interface SignUpPersonArgs {
	email: string
	/** Plaintext password. Mutually exclusive with {@link passwordHash}; omit both to create a person without one. */
	password?: string
	/** Pre-computed bcrypt hash — the tenant API accepts `$2b$` only. */
	passwordHash?: string
	name?: string
	roles?: readonly string[]
	captchaToken?: string
}

export interface CreateSessionTokenArgs {
	email?: string
	personId?: string
	expiration?: number
	options?: SignInOptions
}

export interface TenantCreatedSessionToken {
	token: string
	personId: string
	identityId: string
	email: string | null
	name: string | null
}

export interface ChangeProfileArgs {
	email?: string
	name?: string
}

/** The subset of a `person$$` selection the CLI maps — an actual row carries more, which is fine. */
interface PersonRow {
	readonly id: string
	readonly email?: string
	readonly name?: string
	readonly otpEnabled: boolean
	readonly emailOtpEnabled: boolean
	readonly emailVerified: boolean
	readonly identity: { readonly id: string }
}

// Fetchers are immutable and reusable, so they are built once at module load.
const personsFetcher = query$.persons(person$$.identity(identity$.id))
const personByIdFetcher = query$.personById(
	person$$
		.identity(identity$.id.roles.sessions(sessionInfo$$))
		.identityProviders(personIdentityProvider$.id.createdAt.externalIdentifier.identityProvider(identityProviderListItem$$)),
)
const signUpFetcher = mutation$.signUp(
	signUpResponse$$.error(signUpError$$).result(signUpResult$.person(person$$.identity(identity$.id))),
)
const changeProfileFetcher = mutation$.changeProfile(changeProfileResponse$$.error(changeProfileError$$))
const changePasswordFetcher = mutation$.changePassword(changePasswordResponse$$.error(changePasswordError$$))
const disablePersonFetcher = mutation$.disablePerson(disablePersonResponse$$.error(disablePersonError$$))
const forceSignOutPersonFetcher = mutation$.forceSignOutPerson(forceSignOutPersonResponse$$.error(forceSignOutPersonError$$))
const resetPersonMfaFetcher = mutation$.resetPersonMfa(resetPersonMfaResponse$$.error(resetPersonMfaError$$))
const createResetPasswordRequestFetcher = mutation$.createResetPasswordRequest(
	createPasswordResetRequestResponse$$.error(createPasswordResetRequestError$$),
)
const createSessionTokenFetcher = mutation$.createSessionToken(
	createSessionTokenResponse$$
		.error(createSessionTokenError$$)
		.result(createSessionTokenResult$.token.person(person$$.id.email.name.identity(identity$.id))),
)
const addGlobalIdentityRolesFetcher = mutation$.addGlobalIdentityRoles(
	addGlobalIdentityRolesResponse$$.error(addGlobalIdentityRolesError$$).result(addGlobalIdentityRolesResult$.identity(identity$.id.roles)),
)
const removeGlobalIdentityRolesFetcher = mutation$.removeGlobalIdentityRoles(
	removeGlobalIdentityRolesResponse$$.error(removeGlobalIdentityRolesError$$).result(
		removeGlobalIdentityRolesResult$.identity(identity$.id.roles),
	),
)

const toTenantPerson = (person: PersonRow): TenantPerson => ({
	id: person.id,
	identityId: person.identity.id,
	email: person.email ?? null,
	name: person.name ?? null,
	otpEnabled: person.otpEnabled,
	emailOtpEnabled: person.emailOtpEnabled,
	emailVerified: person.emailVerified,
})

/** Persons, their global identity roles and their sessions. */
export class TenantPersonClient {
	constructor(
		private readonly transport: TenantApiTransport,
	) {
	}

	public async listPersons({ filter, limit, offset }: ListPersonsArgs = {}): Promise<TenantPerson[]> {
		const result = await this.transport.exec(personsFetcher, { filter, limit, offset })
		return result.persons.map(it => ({
			id: it.id,
			identityId: it.identity.id,
			email: it.email ?? null,
			name: it.name ?? null,
			otpEnabled: it.otpEnabled,
			emailOtpEnabled: it.emailOtpEnabled,
			emailVerified: it.emailVerified,
		}))
	}

	/** Null both when the person does not exist and when the caller may not see them — the API does not distinguish. */
	public async getPerson(id: string): Promise<TenantPersonDetail | null> {
		const result = await this.transport.exec(personByIdFetcher, { id })
		const person = result.personById
		if (!person) {
			return null
		}
		return {
			...toTenantPerson(person),
			passwordlessEnabled: person.passwordlessEnabled ?? null,
			roles: person.identity.roles ? [...person.identity.roles] : null,
			sessions: person.identity.sessions.map(it => ({
				id: it.id,
				createdAt: it.createdAt,
				expiresAt: it.expiresAt ?? null,
				lastUsedAt: it.lastUsedAt ?? null,
				lastIp: it.lastIp ?? null,
				lastUserAgent: it.lastUserAgent ?? null,
				createdIp: it.createdIp ?? null,
				createdUserAgent: it.createdUserAgent ?? null,
				isCurrent: it.isCurrent,
				trustForwardedClientInfo: it.trustForwardedClientInfo,
			})),
			identityProviders: person.identityProviders.map(it => ({
				id: it.id,
				slug: it.identityProvider.slug,
				type: it.identityProvider.type,
				externalIdentifier: it.externalIdentifier,
				createdAt: it.createdAt,
			})),
		}
	}

	/**
	 * Creates a person through `signUp`. Needs the `PERSON_SIGN_UP` permission, consumes the tenant's
	 * per-IP sign-up rate limit and triggers the verification mail when the tenant requires it.
	 */
	public async signUp({ email, password, passwordHash, name, roles, captchaToken }: SignUpPersonArgs): Promise<TenantPerson> {
		const result = await this.transport.exec(signUpFetcher, { email, password, passwordHash, name, roles, captchaToken })
		this.transport.assertOk(result.signUp, `signUp(${email})`)
		const person = result.signUp?.result?.person
		if (!person) {
			throw new CliError(`signUp(${email}) reported success but returned no person`, {
				code: 'TENANT_API_INVALID_RESPONSE',
				exitCode: ExitCode.InternalError,
			})
		}
		return toTenantPerson(person)
	}

	public async changeProfile(personId: string, { email, name }: ChangeProfileArgs): Promise<void> {
		const result = await this.transport.exec(changeProfileFetcher, { personId, email, name })
		this.transport.assertOk(result.changeProfile, `changeProfile(${personId})`)
	}

	public async changePassword(personId: string, password: string): Promise<void> {
		const result = await this.transport.exec(changePasswordFetcher, { personId, password })
		this.transport.assertOk(result.changePassword, `changePassword(${personId})`)
	}

	public async disablePerson(personId: string): Promise<void> {
		const result = await this.transport.exec(disablePersonFetcher, { personId })
		this.transport.assertOk(result.disablePerson, `disablePerson(${personId})`)
	}

	public async forceSignOutPerson(personId: string, reason?: string): Promise<void> {
		const result = await this.transport.exec(forceSignOutPersonFetcher, { personId, reason })
		this.transport.assertOk(result.forceSignOutPerson, `forceSignOutPerson(${personId})`)
	}

	public async resetPersonMfa(personId: string): Promise<void> {
		const result = await this.transport.exec(resetPersonMfaFetcher, { personId })
		this.transport.assertOk(result.resetPersonMfa, `resetPersonMfa(${personId})`)
	}

	public async createResetPasswordRequest(email: string, options?: CreateResetPasswordRequestOptions, captchaToken?: string): Promise<void> {
		const result = await this.transport.exec(createResetPasswordRequestFetcher, { email, options, captchaToken })
		this.transport.assertOk(result.createResetPasswordRequest, `createResetPasswordRequest(${email})`)
	}

	public async createSessionToken({ email, personId, expiration, options }: CreateSessionTokenArgs): Promise<TenantCreatedSessionToken> {
		const result = await this.transport.exec(createSessionTokenFetcher, { email, personId, expiration, options })
		this.transport.assertOk(result.createSessionToken, 'createSessionToken')
		const tokenResult = result.createSessionToken?.result
		if (!tokenResult) {
			throw new CliError('createSessionToken reported success but returned no token.', {
				code: 'TENANT_API_INVALID_RESPONSE',
				exitCode: ExitCode.InternalError,
			})
		}
		return {
			token: tokenResult.token,
			personId: tokenResult.person.id,
			identityId: tokenResult.person.identity.id,
			email: tokenResult.person.email ?? null,
			name: tokenResult.person.name ?? null,
		}
	}

	/** Returns the identity's roles after the change, or null when the caller may not read them. */
	public async addGlobalIdentityRoles(identityId: string, roles: readonly string[]): Promise<string[] | null> {
		const result = await this.transport.exec(addGlobalIdentityRolesFetcher, { identityId, roles })
		this.transport.assertOk(result.addGlobalIdentityRoles, `addGlobalIdentityRoles(${identityId})`)
		const resultRoles = result.addGlobalIdentityRoles?.result?.identity.roles
		return resultRoles ? [...resultRoles] : null
	}

	/** Returns the identity's roles after the change, or null when the caller may not read them. */
	public async removeGlobalIdentityRoles(identityId: string, roles: readonly string[]): Promise<string[] | null> {
		const result = await this.transport.exec(removeGlobalIdentityRolesFetcher, { identityId, roles })
		this.transport.assertOk(result.removeGlobalIdentityRoles, `removeGlobalIdentityRoles(${identityId})`)
		const resultRoles = result.removeGlobalIdentityRoles?.result?.identity.roles
		return resultRoles ? [...resultRoles] : null
	}
}
