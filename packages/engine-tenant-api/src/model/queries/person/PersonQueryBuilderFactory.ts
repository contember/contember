import { PersonRow } from './types.js'
import { SelectBuilder } from '@contember/database'

export class PersonQueryBuilderFactory {
	public static createPersonQueryBuilder() {
		return SelectBuilder.create<PersonRow>()
			.select(['person', 'id'])
			.select(['person', 'password_hash'])
			.select(['person', 'otp_uri'])
			.select(['person', 'otp_activated_at'])
			.select(['person', 'identity_id'])
			.select(['person', 'email'])
			.select(['identity', 'roles'])
			.from('person')
			.join('identity', 'identity', expr => expr.columnsEq(['identity', 'id'], ['person', 'identity_id']))
	}
}
