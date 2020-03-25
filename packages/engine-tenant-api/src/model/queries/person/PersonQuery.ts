import { ConditionBuilder, DatabaseQuery, DatabaseQueryable, Operator, SelectBuilder } from '@contember/database'
import { MaybePersonRow, PersonRow } from './types'
import { PersonQueryBuilderFactory } from './PersonQueryBuilderFactory'

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

	async fetch({ db }: DatabaseQueryable): Promise<MaybePersonRow> {
		const rows = await PersonQueryBuilderFactory.createPersonQueryBuilder()
			.where(expr => this.applyCondition(expr))
			.getResult(db)

		return this.fetchOneOrNull(rows)
	}

	private applyCondition(conditionBuilder: ConditionBuilder): ConditionBuilder {
		if ('email' in this.condition) {
			return conditionBuilder.compare(['person', 'email'], Operator.eq, this.condition.email)
		} else if ('id' in this.condition) {
			return conditionBuilder.compare(['person', 'id'], Operator.eq, this.condition.id)
		} else if ('identity_id' in this.condition) {
			return conditionBuilder.compare(['person', 'identity_id'], Operator.eq, this.condition.identity_id)
		} else {
			;((_: never): never => {
				throw new Error()
			})(this.condition)
		}
	}
}

export { PersonQuery }
