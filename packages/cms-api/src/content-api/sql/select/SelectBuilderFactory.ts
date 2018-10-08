import SelectBuilder from './SelectBuilder'
import SelectHydrator from './SelectHydrator'
import QueryBuilder from '../../../core/knex/QueryBuilder'

export default interface SelectBuilderFactory {
	create(qb: QueryBuilder, hydrator: SelectHydrator): SelectBuilder
}
