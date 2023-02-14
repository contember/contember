import { FieldFallbackView, FieldFallbackViewPublicProps } from '../../../../fieldViews'
import { createHasManySelectCell, createHasManySelectCellRenderer } from '../../cells'
import { DataGridColumnPublicProps } from '../types'
import { SelectCellFilter } from '../filters'

/**
 * DataGrid cell which allows displaying and filtering by has-many relations.
 *
 * @example
 * ```
 * <HasManySelectCell header="Tags" field="tags" options="Tag.name" />
 * ```
 *
 * @group Data grid
 */
export const HasManySelectCell = createHasManySelectCell<DataGridColumnPublicProps, FieldFallbackViewPublicProps>({
	FilterRenderer: SelectCellFilter,
	ValueRenderer: createHasManySelectCellRenderer({
		FallbackRenderer: FieldFallbackView,
	}),
})
