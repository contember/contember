import { ConditionBuilder, DatabaseQuery, DatabaseQueryable } from '@contember/database'
import { MaybePersonRow, PersonRow } from './types'

class PersonQuery extends DatabaseQuery<MaybePersonRow> {
	constructor(private readonly condition: { email: string } | { id: string } | { identity_id: string }) {
		super()
	}

	static byId(id: string): PersonQuery {
		return new PersonQuery({ id })
	}

	static byEmail(email: string): PersonQuery {
		return new PersonQuery({ email })
	}

	static byIdentity(identity_id: string): PersonQuery {
		return new PersonQuery({ identity_id })
	}

	async fetch(queryable: DatabaseQueryable): Promise<MaybePersonRow> {
		const rows = await queryable
			.createSelectBuilder<PersonRow>()
			.select(['person', 'id'])
			.select(['person', 'password_hash'])
			.select(['person', 'identity_id'])
			.select(['person', 'email'])
			.select(['identity', 'roles'])
			.from('person')
			.join('identity', 'identity', expr => expr.columnsEq(['identity', 'id'], ['person', 'identity_id']))
			.where(expr => this.applyCondition(expr))
			.getResult()

		return this.fetchOneOrNull(rows)
	}

	private applyCondition(conditionBuilder: ConditionBuilder): void {
		if ('email' in this.condition) {
			conditionBuilder.compare(['person', 'email'], ConditionBuilder.Operator.eq, this.condition.email)
		} else if ('id' in this.condition) {
			conditionBuilder.compare(['person', 'id'], ConditionBuilder.Operator.eq, this.condition.id)
		} else if ('identity_id' in this.condition) {
			conditionBuilder.compare(['person', 'identity_id'], ConditionBuilder.Operator.eq, this.condition.identity_id)
		} else {
			;((_: never): never => {
				throw new Error()
			})(this.condition)
		}
	}
}

export { PersonQuery }
