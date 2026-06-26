import { PersonListRow, PersonRow } from './types.js'
import { SelectBuilder } from '@contember/database'

export class PersonQueryBuilderFactory {
	/**
	 * Slim builder for listings — selects only the columns surfaced by
	 * {@link PersonResponseFactory}, omitting `password_hash` / `totp_secret*`
	 * and the `identity` join that the full builder needs only for `roles`.
	 */
	public static createPersonListQueryBuilder() {
		return SelectBuilder.create<PersonListRow>()
			.select(['person', 'id'])
			.select(['person', 'identity_id'])
			.select(['person', 'email'])
			.select(['person', 'name'])
			.select(['person_mfa', 'totp_activated_at'], 'otp_activated_at')
			.select(expr => expr.raw('coalesce("person_mfa"."email_otp_enabled", false)'), 'email_otp_enabled')
			.select(['person', 'passwordless_enabled'])
			.select(['person', 'email_verified_at'])
			.from('person')
			.leftJoin('person_mfa', 'person_mfa', expr => expr.columnsEq(['person_mfa', 'person_id'], ['person', 'id']))
	}

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
			// MFA grace gate on the DB clock (against now()), so app/DB skew can't
			// extend the window. See SignInManager.enforceMfaEnrollment / CLAUDE.md.
			.select(expr => expr.raw('"person"."mfa_grace_until" is not null and "person"."mfa_grace_until" > now()'), 'is_in_grace')
			.select(['person', 'email_verified_at'])
			.select(['person', 'email_verification_required'])
			.select(['identity', 'roles'])
			.from('person')
			.join('identity', 'identity', expr => expr.columnsEq(['identity', 'id'], ['person', 'identity_id']))
			.leftJoin('person_mfa', 'person_mfa', expr => expr.columnsEq(['person_mfa', 'person_id'], ['person', 'id']))
	}
}
