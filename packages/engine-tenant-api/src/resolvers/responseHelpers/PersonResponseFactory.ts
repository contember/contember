import { PersonListRow } from '../../model/index.js'
import { IdentityProjectRelation, Person } from '../../schema/index.js'

export class PersonResponseFactory {
	// Accepts the slim `PersonListRow` shape; the full `PersonRow` (from byId/auth
	// lookups) is structurally compatible, so both listing and single-person paths
	// reuse this without dragging secret columns through the listing.
	public static createPersonResponse(personRow: PersonListRow, projects: ReadonlyArray<IdentityProjectRelation> = []): Person {
		return {
			id: personRow.id,
			otpEnabled: !!personRow.otp_activated_at,
			emailOtpEnabled: personRow.email_otp_enabled,
			email: personRow.email,
			emailVerified: !!personRow.email_verified_at,
			name: personRow.name,
			passwordlessEnabled: personRow.passwordless_enabled,
			identity: {
				id: personRow.identity_id,
				projects,
				sessions: [],
			},
			// resolved by PersonTypeResolver.identityProviders; placeholder keeps the type complete
			identityProviders: [],
		}
	}
}
