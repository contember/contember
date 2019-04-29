import SelectBuilder from './SelectBuilder'
import SelectHydrator from './SelectHydrator'
import DbSelectBuilder from '../../../core/database/SelectBuilder'

export default interface SelectBuilderFactory {
	create(qb: DbSelectBuilder, hydrator: SelectHydrator): SelectBuilder
}
