import { PersonRow } from '../../model'
import { IdentityProjectRelation, Person } from '../../schema'

export class PersonResponseFactory {
	public static createPersonResponse(personRow: Omit<PersonRow, 'roles'>, projects: ReadonlyArray<IdentityProjectRelation> = []): Person {
		return {
			id: personRow.id,
			otpEnabled: !!personRow.otp_activated_at,
			email: personRow.email,
			name: personRow.name,
			identity: {
				id: personRow.identity_id,
				projects,
			},
		}
	}
}
