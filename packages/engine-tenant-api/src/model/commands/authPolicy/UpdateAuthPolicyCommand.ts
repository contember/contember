import { Command } from '../Command'
import { UpdateBuilder } from '@contember/database'
import { AuthPolicyScope } from '../../type'

/**
 * Updates an existing `auth_policy` row. Only the supplied fields are written
 * (an `undefined` field is left untouched; an explicit `null` clears it).
 * `updated_at` is always bumped. Returns whether a row was affected.
 */
export class UpdateAuthPolicyCommand implements Command<boolean> {
	constructor(
		private readonly id: string,
		private readonly values: {
			scope?: AuthPolicyScope
			projectId?: string | null
			roles?: string[]
			mfaRequired?: boolean | null
			tokenExpiration?: string | null
			idleTimeout?: string | null
			rememberMeAllowed?: boolean | null
		},
	) {}

	async execute({ db, providers }: Command.Args): Promise<boolean> {
		const result = await UpdateBuilder.create()
			.table('auth_policy')
			.where({ id: this.id })
			.values({
				scope: this.values.scope,
				project_id: this.values.projectId,
				roles: this.values.roles,
				mfa_required: this.values.mfaRequired,
				token_expiration: this.values.tokenExpiration,
				idle_timeout: this.values.idleTimeout,
				remember_me_allowed: this.values.rememberMeAllowed,
				updated_at: providers.now(),
			})
			.execute(db)
		return result > 0
	}
}
