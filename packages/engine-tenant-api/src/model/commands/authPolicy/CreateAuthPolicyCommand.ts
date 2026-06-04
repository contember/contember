import { Command } from '../Command.js'
import { InsertBuilder } from '@contember/database'
import { AuthPolicyScope } from '../../type/index.js'

export type AuthPolicyWriteValues = {
	scope: AuthPolicyScope
	projectId: string | null
	roles: string[]
	mfaRequired: boolean | null
	tokenExpiration: string | null
	idleTimeout: string | null
	graceDuration: string | null
	rememberMeAllowed: boolean | null
}

/** Inserts a new `auth_policy` row. Returns the generated id. */
export class CreateAuthPolicyCommand implements Command<string> {
	constructor(private readonly values: AuthPolicyWriteValues) {}

	async execute({ db, providers }: Command.Args): Promise<string> {
		const id = providers.uuid()
		const now = providers.now()
		await InsertBuilder.create()
			.into('auth_policy')
			.values({
				id,
				scope: this.values.scope,
				project_id: this.values.projectId,
				roles: this.values.roles,
				mfa_required: this.values.mfaRequired,
				token_expiration: this.values.tokenExpiration,
				idle_timeout: this.values.idleTimeout,
				grace_duration: this.values.graceDuration,
				remember_me_allowed: this.values.rememberMeAllowed,
				created_at: now,
				updated_at: now,
			})
			.execute(db)
		return id
	}
}
