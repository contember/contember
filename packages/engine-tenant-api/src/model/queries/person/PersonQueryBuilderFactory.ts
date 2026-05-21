import { PersonRow } from './types'
import { SelectBuilder } from '@contember/database'

export class PersonQueryBuilderFactory {
	public static createPersonQueryBuilder() {
		return SelectBuilder.create<PersonRow>()
			.select(['person', 'id'])
			.select(['person', 'password_hash'])
			.select(['person_mfa', 'totp_secret'], 'otp_secret')
			.select(['person_mfa', 'totp_secret_version'], 'otp_secret_version')
			.select(['person_mfa', 'totp_activated_at'], 'otp_activated_at')
			.select(['person_mfa', 'totp_pending_secret'], 'otp_pending_secret')
			.select(['person_mfa', 'totp_pending_version'], 'otp_pending_version')
			.select(['person_mfa', 'totp_pending_created_at'], 'otp_pending_created_at')
			.select(expr => expr.raw('coalesce("person_mfa"."email_otp_enabled", false)'), 'email_otp_enabled')
			.select(['person', 'identity_id'])
			.select(['person', 'email'])
			.select(['person', 'name'])
			.select(['person', 'disabled_at'])
			.select(['person', 'passwordless_enabled'])
			.select(['person', 'mfa_grace_until'])
			.select(['identity', 'roles'])
			.from('person')
			.join('identity', 'identity', expr => expr.columnsEq(['identity', 'id'], ['person', 'identity_id']))
			.leftJoin('person_mfa', 'person_mfa', expr => expr.columnsEq(['person_mfa', 'person_id'], ['person', 'id']))
	}
}
