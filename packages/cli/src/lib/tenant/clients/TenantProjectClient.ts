import {
	addIDPError$$,
	addIDPResponse$$,
	apiKeyWithToken$$,
	type CaptchaProvider,
	config$,
	configCaptcha$$,
	configCaptchaProtect$$,
	configEmailChange$$,
	configLogin$$,
	configLoginAnomalyDetection$$,
	configPassword$$,
	configPasswordless$$,
	type ConfigPolicy,
	configRateLimits$,
	configRateLimitWindow$$,
	configSignup$$,
	configureError$$,
	configureResponse$$,
	createProjectResponse$$,
	createProjectResponseError$$,
	createProjectResult$,
	disableIDPError$$,
	disableIDPResponse$$,
	enableIDPError$$,
	enableIDPResponse$$,
	identity$$,
	identityGlobalPermissions$$,
	identityProjectRelation$,
	identityProvider$,
	membership$$,
	mutation$,
	project$,
	projectSecretInfo$$,
	query$,
	roleConditionVariableDefinition$$,
	roleDefinition$,
	roleEntityVariableDefinition$$,
	rolePredefinedVariableDefinition$$,
	roleVariableDefinition$$,
	setProjectSecretError$$,
	setProjectSecretResponse$$,
	updateIDPError$$,
	updateIDPResponse$$,
	updateProjectError$$,
	updateProjectResponse$$,
} from '@contember/graphql-client-tenant'
import type { ModelType } from 'graphql-ts-client-api'
import { TenantApiTransport } from '../TenantApiTransport.js'
import { TenantGlobalConfig, TenantIdpOptions } from '../tenantConfig.js'

export interface RemoteIdentityProvider {
	slug: string
	type: string
	disabledAt: string | null
}

export interface TenantProjectSummary {
	id: string
	name: string
	slug: string
}

export interface TenantProjectRole {
	name: string
	/** Variable names the role expects, retained for compatibility. */
	variables: string[]
	variableDefinitions: TenantProjectRoleVariableDefinition[]
}

export type TenantProjectRoleVariableDefinition =
	| { type: 'entity'; name: string; entityName: string }
	| { type: 'predefined'; name: string; value: string }
	| { type: 'condition'; name: string }

export interface TenantProjectSecret {
	key: string
	createdAt: string
	updatedAt: string
}

export interface TenantProjectDetail {
	id: string
	name: string
	slug: string
	config: unknown
	roles: TenantProjectRole[]
	secrets: TenantProjectSecret[]
}

export interface TenantCreateProjectDetails {
	name?: string
	config?: unknown
	/** Skip issuing a deploy API key for the project. */
	noDeployToken?: boolean
}

export interface TenantCreateProjectResult {
	/** Null when {@link TenantCreateProjectDetails.noDeployToken} was requested. */
	deployerApiKey: { id: string; token: string | null } | null
}

export interface TenantUpdateProjectChanges {
	name?: string
	config?: unknown
	mergeConfig?: boolean
}

export interface TenantRateLimitWindowState {
	limit: number
	window: string
}

/** The tenant-wide configuration returned by `Query.configuration` — the read side of {@link TenantGlobalConfig}. */
export interface TenantConfigState {
	signup: { requireEmailVerification: boolean }
	emailChange: { requireVerification: boolean }
	passwordless: { enabled: ConfigPolicy; url: string | null; expiration: string }
	password: {
		minLength: number
		requireUppercase: number
		requireLowercase: number
		requireDigit: number
		requireSpecial: number
		pattern: string | null
		checkBlacklist: boolean
		checkHibp: boolean
	}
	login: {
		baseBackoff: string
		maxBackoff: string
		attemptWindow: string
		revealUserExists: boolean
		revealLoginMethod: boolean
		defaultTokenExpiration: string
		maxTokenExpiration: string | null
		mfaGraceDuration: string
		anomalyDetection: {
			enabled: boolean
			historySize: number
			emailThreshold: number
			stepUpThreshold: number
		}
	}
	captcha: {
		provider: CaptchaProvider | null
		threshold: number | null
		protect: {
			signUp: boolean
			passwordReset: boolean
			passwordlessInit: boolean
			emailVerification: boolean
		}
	}
	rateLimits: {
		signUpPerIp: TenantRateLimitWindowState
		loginPerIp: TenantRateLimitWindowState
		passwordResetPerIp: TenantRateLimitWindowState
		passwordlessInitPerIp: TenantRateLimitWindowState
		emailOtpPerPerson: TenantRateLimitWindowState
		emailVerificationPerIp: TenantRateLimitWindowState
	}
}

export interface TenantWhoAmIProject {
	slug: string
	name: string
	roles: string[]
}

/** `Query.me` — the identity behind the token the CLI is using. */
export interface TenantWhoAmI {
	id: string
	description: string | null
	/** Global (tenant-wide) roles — empty for an identity whose access is entirely project-scoped. */
	roles: string[]
	permissions: { canCreateProject: boolean; canDeployEntrypoint: boolean } | null
	projects: TenantWhoAmIProject[]
}

// Fetchers are immutable and reusable, so they are built once at module load.
const createProjectFetcher = mutation$.createProject(
	createProjectResponse$$.error(createProjectResponseError$$).result(createProjectResult$.deployerApiKey(apiKeyWithToken$$)),
)
const setProjectSecretFetcher = mutation$.setProjectSecret(setProjectSecretResponse$$.error(setProjectSecretError$$))
const updateProjectFetcher = mutation$.updateProject(updateProjectResponse$$.error(updateProjectError$$))
const configureFetcher = mutation$.configure(configureResponse$$.error(configureError$$))
const configurationFetcher = query$.configuration(
	config$
		.signup(configSignup$$)
		.emailChange(configEmailChange$$)
		.passwordless(configPasswordless$$)
		.password(configPassword$$)
		.login(configLogin$$.anomalyDetection(configLoginAnomalyDetection$$))
		.captcha(configCaptcha$$.protect(configCaptchaProtect$$))
		.rateLimits(
			configRateLimits$
				.signUpPerIp(configRateLimitWindow$$)
				.loginPerIp(configRateLimitWindow$$)
				.passwordResetPerIp(configRateLimitWindow$$)
				.passwordlessInitPerIp(configRateLimitWindow$$)
				.emailOtpPerPerson(configRateLimitWindow$$)
				.emailVerificationPerIp(configRateLimitWindow$$),
		),
)
const projectsFetcher = query$.projects(project$.id.name.slug)
const roleVariableFetcher = roleVariableDefinition$$
	.on(roleConditionVariableDefinition$$)
	.on(roleEntityVariableDefinition$$)
	.on(rolePredefinedVariableDefinition$$)
const toRoleVariableDefinition = (variable: ModelType<typeof roleVariableFetcher>): TenantProjectRoleVariableDefinition => {
	switch (variable.__typename) {
		case 'RoleEntityVariableDefinition':
			return { type: 'entity', name: variable.name, entityName: variable.entityName }
		case 'RolePredefinedVariableDefinition':
			return { type: 'predefined', name: variable.name, value: variable.value }
		case 'RoleConditionVariableDefinition':
			return { type: 'condition', name: variable.name }
	}
}
const projectBySlugFetcher = query$.projectBySlug(
	project$
		.id.name.slug.config
		.roles(roleDefinition$.name.variables(roleVariableFetcher))
		.secrets(projectSecretInfo$$),
)
const identityProvidersFetcher = query$.identityProviders(identityProvider$.slug.type.disabledAt)
const addIdpFetcher = mutation$.addIDP(addIDPResponse$$.error(addIDPError$$))
const updateIdpFetcher = mutation$.updateIDP(updateIDPResponse$$.error(updateIDPError$$))
const enableIdpFetcher = mutation$.enableIDP(enableIDPResponse$$.error(enableIDPError$$))
const disableIdpFetcher = mutation$.disableIDP(disableIDPResponse$$.error(disableIDPError$$))
const meFetcher = query$.me(
	identity$$
		.permissions(identityGlobalPermissions$$)
		.projects(identityProjectRelation$.project(project$.slug.name).memberships(membership$$)),
)

const toRateLimitWindow = (it: { limit: number; window: string }): TenantRateLimitWindowState => ({ limit: it.limit, window: it.window })

/** Projects, project secrets, global tenant configuration, identity providers and `me`. */
export class TenantProjectClient {
	constructor(
		private readonly transport: TenantApiTransport,
	) {
	}

	public async listProjects(): Promise<TenantProjectSummary[]> {
		const result = await this.transport.exec(projectsFetcher, {})
		return result.projects.map(it => ({ id: it.id, name: it.name, slug: it.slug }))
	}

	/** Null both when the project does not exist and when the caller may not see it — the API does not distinguish. */
	public async getProjectBySlug(slug: string): Promise<TenantProjectDetail | null> {
		const result = await this.transport.exec(projectBySlugFetcher, { slug })
		const project = result.projectBySlug
		if (!project) {
			return null
		}
		return {
			id: project.id,
			name: project.name,
			slug: project.slug,
			config: project.config,
			roles: project.roles.map(role => ({
				name: role.name,
				variables: role.variables.map(it => it.name),
				variableDefinitions: role.variables.map(toRoleVariableDefinition),
			})),
			secrets: project.secrets.map(it => ({ key: it.key, createdAt: it.createdAt, updatedAt: it.updatedAt })),
		}
	}

	/** Returns `null` (nothing created) when `ignoreExisting` swallowed an `ALREADY_EXISTS`. */
	public async createProject(slug: string, ignoreExisting = false, details?: TenantCreateProjectDetails): Promise<TenantCreateProjectResult | null> {
		const result = await this.transport.exec(createProjectFetcher, {
			projectSlug: slug,
			name: details?.name,
			config: details?.config,
			options: details?.noDeployToken ? { noDeployToken: true } : undefined,
		})
		if (ignoreExisting && result.createProject?.error?.code === 'ALREADY_EXISTS') {
			return null
		}
		this.transport.assertOk(result.createProject, `createProject(${slug})`)
		const deployerApiKey = result.createProject?.result?.deployerApiKey
		return { deployerApiKey: deployerApiKey ? { id: deployerApiKey.id, token: deployerApiKey.token ?? null } : null }
	}

	public async updateProject(slug: string, changes: TenantUpdateProjectChanges): Promise<void> {
		const result = await this.transport.exec(updateProjectFetcher, {
			projectSlug: slug,
			name: changes.name,
			config: changes.config,
			mergeConfig: changes.mergeConfig,
		})
		this.transport.assertOk(result.updateProject, `updateProject(${slug})`)
	}

	public async setProjectSecret(slug: string, key: string, value: string): Promise<void> {
		const result = await this.transport.exec(setProjectSecretFetcher, { projectSlug: slug, key, value })
		this.transport.assertOk(result.setProjectSecret, `setProjectSecret(${slug}/${key})`)
	}

	public async configure(config: TenantGlobalConfig): Promise<void> {
		const result = await this.transport.exec(configureFetcher, { config })
		this.transport.assertOk(result.configure, 'configure')
	}

	public async configuration(): Promise<TenantConfigState> {
		const result = await this.transport.exec(configurationFetcher, {})
		const config = result.configuration
		return {
			signup: { requireEmailVerification: config.signup.requireEmailVerification },
			emailChange: { requireVerification: config.emailChange.requireVerification },
			passwordless: {
				enabled: config.passwordless.enabled,
				url: config.passwordless.url ?? null,
				expiration: config.passwordless.expiration,
			},
			password: {
				minLength: config.password.minLength,
				requireUppercase: config.password.requireUppercase,
				requireLowercase: config.password.requireLowercase,
				requireDigit: config.password.requireDigit,
				requireSpecial: config.password.requireSpecial,
				pattern: config.password.pattern ?? null,
				checkBlacklist: config.password.checkBlacklist,
				checkHibp: config.password.checkHibp,
			},
			login: {
				baseBackoff: config.login.baseBackoff,
				maxBackoff: config.login.maxBackoff,
				attemptWindow: config.login.attemptWindow,
				revealUserExists: config.login.revealUserExists,
				revealLoginMethod: config.login.revealLoginMethod,
				defaultTokenExpiration: config.login.defaultTokenExpiration,
				maxTokenExpiration: config.login.maxTokenExpiration ?? null,
				mfaGraceDuration: config.login.mfaGraceDuration,
				anomalyDetection: {
					enabled: config.login.anomalyDetection.enabled,
					historySize: config.login.anomalyDetection.historySize,
					emailThreshold: config.login.anomalyDetection.emailThreshold,
					stepUpThreshold: config.login.anomalyDetection.stepUpThreshold,
				},
			},
			captcha: {
				provider: config.captcha.provider ?? null,
				threshold: config.captcha.threshold ?? null,
				protect: {
					signUp: config.captcha.protect.signUp,
					passwordReset: config.captcha.protect.passwordReset,
					passwordlessInit: config.captcha.protect.passwordlessInit,
					emailVerification: config.captcha.protect.emailVerification,
				},
			},
			rateLimits: {
				signUpPerIp: toRateLimitWindow(config.rateLimits.signUpPerIp),
				loginPerIp: toRateLimitWindow(config.rateLimits.loginPerIp),
				passwordResetPerIp: toRateLimitWindow(config.rateLimits.passwordResetPerIp),
				passwordlessInitPerIp: toRateLimitWindow(config.rateLimits.passwordlessInitPerIp),
				emailOtpPerPerson: toRateLimitWindow(config.rateLimits.emailOtpPerPerson),
				emailVerificationPerIp: toRateLimitWindow(config.rateLimits.emailVerificationPerIp),
			},
		}
	}

	public async listIdentityProviders(): Promise<RemoteIdentityProvider[]> {
		const result = await this.transport.exec(identityProvidersFetcher, {})
		return result.identityProviders.map(it => ({
			slug: it.slug,
			type: it.type,
			disabledAt: it.disabledAt ?? null,
		}))
	}

	public async addIdp(slug: string, type: string, configuration: unknown, options?: TenantIdpOptions): Promise<void> {
		const result = await this.transport.exec(addIdpFetcher, { identityProvider: slug, type, configuration, options })
		this.transport.assertOk(result.addIDP, `addIDP(${slug})`)
	}

	public async updateIdp(slug: string, type: string, configuration: unknown, options?: TenantIdpOptions): Promise<void> {
		const result = await this.transport.exec(updateIdpFetcher, {
			identityProvider: slug,
			type,
			configuration,
			options,
			mergeConfiguration: false,
		})
		this.transport.assertOk(result.updateIDP, `updateIDP(${slug})`)
	}

	public async enableIdp(slug: string): Promise<void> {
		const result = await this.transport.exec(enableIdpFetcher, { identityProvider: slug })
		this.transport.assertOk(result.enableIDP, `enableIDP(${slug})`)
	}

	public async disableIdp(slug: string): Promise<void> {
		const result = await this.transport.exec(disableIdpFetcher, { identityProvider: slug })
		this.transport.assertOk(result.disableIDP, `disableIDP(${slug})`)
	}

	public async whoAmI(): Promise<TenantWhoAmI> {
		const result = await this.transport.exec(meFetcher, {})
		const me = result.me
		return {
			id: me.id,
			description: me.description ?? null,
			roles: me.roles ? [...me.roles] : [],
			permissions: me.permissions
				? { canCreateProject: me.permissions.canCreateProject, canDeployEntrypoint: me.permissions.canDeployEntrypoint }
				: null,
			projects: me.projects.map(it => ({
				slug: it.project.slug,
				name: it.project.name,
				roles: it.memberships.map(m => m.role),
			})),
		}
	}
}
