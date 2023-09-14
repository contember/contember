import { FieldFallbackView, FieldFallbackViewPublicProps } from '@contember/react-binding-ui'
import { createHasManySelectCell, createHasManySelectCellRenderer } from '@contember/react-datagrid'
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
