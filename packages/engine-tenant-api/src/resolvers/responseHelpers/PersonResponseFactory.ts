import { PersonRow } from '../../model/index.js'
import { IdentityProjectRelation, Person } from '../../schema/index.js'

export class PersonResponseFactory {
	public static createPersonResponse(personRow: Omit<PersonRow, 'roles'>, projects: ReadonlyArray<IdentityProjectRelation> = []): Person {
		return {
			id: personRow.id,
			otpEnabled: !!personRow.otp_activated_at,
			email: personRow.email,
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
