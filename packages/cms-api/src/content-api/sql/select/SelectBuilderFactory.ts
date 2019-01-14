import SelectBuilder from './SelectBuilder'
import SelectHydrator from './SelectHydrator'
import DbSelectBuilder from '../../../core/knex/SelectBuilder'

export default interface SelectBuilderFactory {
	create(qb: DbSelectBuilder, hydrator: SelectHydrator): SelectBuilder
}
