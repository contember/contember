import { CliError, ExitCode } from '@contember/cli-common'
import {
	addMailTemplateError$$,
	addMailTemplateResponse$$,
	authLogEntry$$,
	type AuthLogFilter,
	authLogPage$,
	authPolicy$$,
	type AuthPolicyInput,
	type AuthPolicyScope,
	createAuthPolicyError$$,
	createAuthPolicyResponse$$,
	createAuthPolicyResult$$,
	deleteAuthPolicyError$$,
	deleteAuthPolicyResponse$$,
	mailTemplateData$$,
	type MailTemplateIdentifier,
	type MailType,
	mutation$,
	query$,
	removeMailTemplateError$$,
	removeMailTemplateResponse$$,
	updateAuthPolicyError$$,
	updateAuthPolicyResponse$$,
} from '@contember/graphql-client-tenant'
import { describeAuthPolicy } from '../authPolicy.js'
import { TenantApiTransport } from '../TenantApiTransport.js'
import { TenantMailTemplate } from '../tenantConfig.js'

/** A policy as it exists server-side. The config-side counterpart is `TenantAuthPolicy` in `tenantConfig.ts`. */
export interface RemoteAuthPolicy {
	id: string
	scope: AuthPolicyScope
	/** Project slug, `null` for a global policy. */
	project: string | null
	roles: string[]
	mfaRequired: boolean | null
	/** ISO 8601 duration, e.g. `PT1H`. */
	tokenExpiration: string | null
	idleTimeout: string | null
	mfaGraceDuration: string | null
	rememberMeAllowed: boolean | null
}

export interface TenantMailTemplateData {
	projectSlug: string | null
	type: MailType
	variant: string | null
	subject: string
	content: string
	useLayout: boolean
	replyTo: string | null
}

export interface TenantAuthLogEntry {
	id: string
	createdAt: string
	type: string
	success: boolean
	invokedByIdentityId: string | null
	personId: string | null
	targetPersonId: string | null
	personInputIdentifier: string | null
	errorCode: string | null
	errorMessage: string | null
	ipAddress: string | null
	userAgent: string | null
	identityProviderId: string | null
	metadata: unknown
	eventData: unknown
}

export interface TenantAuthLogPage {
	entries: TenantAuthLogEntry[]
	/** True when more rows exist past `offset + entries.length`. */
	hasMore: boolean
}

export interface ReadAuthLogArgs {
	filter?: AuthLogFilter
	limit?: number
	offset?: number
}

// Fetchers are immutable and reusable, so they are built once at module load.
const authPoliciesFetcher = query$.authPolicies(authPolicy$$)
const createAuthPolicyFetcher = mutation$.createAuthPolicy(
	createAuthPolicyResponse$$.error(createAuthPolicyError$$).result(createAuthPolicyResult$$),
)
const updateAuthPolicyFetcher = mutation$.updateAuthPolicy(updateAuthPolicyResponse$$.error(updateAuthPolicyError$$))
const deleteAuthPolicyFetcher = mutation$.deleteAuthPolicy(deleteAuthPolicyResponse$$.error(deleteAuthPolicyError$$))
const mailTemplatesFetcher = query$.mailTemplates(mailTemplateData$$)
const addMailTemplateFetcher = mutation$.addMailTemplate(addMailTemplateResponse$$.error(addMailTemplateError$$))
const removeMailTemplateFetcher = mutation$.removeMailTemplate(removeMailTemplateResponse$$.error(removeMailTemplateError$$))
const authLogFetcher = query$.authLog(authLogPage$.hasMore.entries(authLogEntry$$))

/** Auth policies, mail templates and the auth log. */
export class TenantPolicyClient {
	constructor(
		private readonly transport: TenantApiTransport,
	) {
	}

	public async listAuthPolicies(): Promise<RemoteAuthPolicy[]> {
		const result = await this.transport.exec(authPoliciesFetcher, {})
		return result.authPolicies.map(it => ({
			id: it.id,
			scope: it.scope,
			project: it.project ?? null,
			roles: [...it.roles],
			mfaRequired: it.mfaRequired ?? null,
			tokenExpiration: it.tokenExpiration ?? null,
			idleTimeout: it.idleTimeout ?? null,
			mfaGraceDuration: it.mfaGraceDuration ?? null,
			rememberMeAllowed: it.rememberMeAllowed ?? null,
		}))
	}

	/** Returns the id of the created policy — the only thing `createAuthPolicy` hands back. */
	public async createAuthPolicy(policy: AuthPolicyInput): Promise<string> {
		const result = await this.transport.exec(createAuthPolicyFetcher, { policy })
		// a policy has no slug, so the target is the only thing that identifies it in an error
		this.transport.assertOk(result.createAuthPolicy, `createAuthPolicy(${describeAuthPolicy(policy)})`)
		const id = result.createAuthPolicy?.result?.id
		if (id === undefined) {
			// ok without a result breaks the schema contract, so there is nothing sensible to report back
			throw new CliError(`createAuthPolicy(${describeAuthPolicy(policy)}) reported success without returning an id.`, {
				code: 'TENANT_API_INVALID_RESPONSE',
				exitCode: ExitCode.InternalError,
			})
		}
		return id
	}

	public async updateAuthPolicy(id: string, policy: AuthPolicyInput): Promise<void> {
		const result = await this.transport.exec(updateAuthPolicyFetcher, { id, policy })
		this.transport.assertOk(result.updateAuthPolicy, `updateAuthPolicy(${id}: ${describeAuthPolicy(policy)})`)
	}

	public async deleteAuthPolicy(id: string): Promise<void> {
		const result = await this.transport.exec(deleteAuthPolicyFetcher, { id })
		this.transport.assertOk(result.deleteAuthPolicy, `deleteAuthPolicy(${id})`)
	}

	public async listMailTemplates(): Promise<TenantMailTemplateData[]> {
		const result = await this.transport.exec(mailTemplatesFetcher, {})
		return result.mailTemplates.map(it => ({
			projectSlug: it.projectSlug ?? null,
			type: it.type,
			variant: it.variant ?? null,
			subject: it.subject,
			content: it.content,
			useLayout: it.useLayout,
			replyTo: it.replyTo ?? null,
		}))
	}

	public async addMailTemplate(template: TenantMailTemplate): Promise<void> {
		const result = await this.transport.exec(addMailTemplateFetcher, { template })
		this.transport.assertOk(result.addMailTemplate, `addMailTemplate(${template.type}/${template.variant ?? ''})`)
	}

	/** A template is addressed by the `projectSlug`/`type`/`variant` triple — it has no id of its own. */
	public async removeMailTemplate(templateIdentifier: MailTemplateIdentifier): Promise<void> {
		const result = await this.transport.exec(removeMailTemplateFetcher, { templateIdentifier })
		this.transport.assertOk(result.removeMailTemplate, `removeMailTemplate(${templateIdentifier.type}/${templateIdentifier.variant ?? ''})`)
	}

	public async readAuthLog({ filter, limit, offset }: ReadAuthLogArgs = {}): Promise<TenantAuthLogPage> {
		const result = await this.transport.exec(authLogFetcher, { filter, limit, offset })
		return {
			hasMore: result.authLog.hasMore,
			entries: result.authLog.entries.map(it => ({
				id: it.id,
				createdAt: it.createdAt,
				type: it.type,
				success: it.success,
				invokedByIdentityId: it.invokedByIdentityId ?? null,
				personId: it.personId ?? null,
				targetPersonId: it.targetPersonId ?? null,
				personInputIdentifier: it.personInputIdentifier ?? null,
				errorCode: it.errorCode ?? null,
				errorMessage: it.errorMessage ?? null,
				ipAddress: it.ipAddress ?? null,
				userAgent: it.userAgent ?? null,
				identityProviderId: it.identityProviderId ?? null,
				metadata: it.metadata ?? null,
				eventData: it.eventData ?? null,
			})),
		}
	}
}
