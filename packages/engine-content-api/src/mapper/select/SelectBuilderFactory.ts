import { SelectBuilder } from './SelectBuilder'
import { SelectHydrator } from './SelectHydrator'
import { SelectBuilder as DbSelectBuilder } from '@contember/database'

export interface SelectBuilderFactory {
	create(qb: DbSelectBuilder<DbSelectBuilder.Result>, hydrator: SelectHydrator): SelectBuilder
}
