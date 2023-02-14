import { createHasManyAbsentCell } from '../../cells'
import { HasManyAbsentCellFilter } from '../filters'
import { DataGridColumnPublicProps } from '../types'

/**
 * Cell for displaying has-many values. Allows only simple filter whether the list is empty or not. For most cases, {@link HasManySelectCell} is recommended.
 *
 * @group Data grid
 */
export const HasManyAbsentCell = createHasManyAbsentCell<DataGridColumnPublicProps>({
	FilterRenderer: HasManyAbsentCellFilter,
})
