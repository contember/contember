import { SelectBuilder } from './SelectBuilder'
import { SelectHydrator } from './SelectHydrator'
import { SelectBuilder as DbSelectBuilder } from '@contember/database'
import { Model } from '@contember/schema'

export interface SelectBuilderFactory {
	create(qb: DbSelectBuilder<DbSelectBuilder.Result>, hydrator: SelectHydrator, relationPath: Model.AnyRelationContext[]): SelectBuilder
}
