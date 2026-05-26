import { PersonRow } from '../../model'
import { IdentityProjectRelation, Person } from '../../schema'

export class PersonResponseFactory {
	public static createPersonResponse(personRow: Omit<PersonRow, 'roles'>, projects: ReadonlyArray<IdentityProjectRelation> = []): Person {
		return {
			id: personRow.id,
			otpEnabled: !!personRow.otp_activated_at,
			email: personRow.email,
			emailVerified: !!personRow.email_verified_at,
			name: personRow.name,
			passwordlessEnabled: personRow.passwordless_enabled,
			identity: {
				id: personRow.identity_id,
				projects,
				sessions: [],
			},
		}
	}
}
