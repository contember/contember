import { FieldFallbackView, FieldFallbackViewPublicProps } from '@contember/react-binding-ui'
import { createHasOneSelectCell, createHasOneSelectCellRenderer } from '@contember/react-datagrid'
import { DataGridColumnPublicProps } from '../types'
import { SelectCellFilter } from '../filters'

/**
 * DataGrid cell which allows displaying and filtering by has-one relations.
 *
 * @example
 * ```
 * <HasOneSelectCell header="Category" field="category" options="Category.name" />
 * ```
 *
 * @group Data grid
 */
export const HasOneSelectCell = createHasOneSelectCell<DataGridColumnPublicProps, FieldFallbackViewPublicProps>({
	FilterRenderer: SelectCellFilter,
	ValueRenderer: createHasOneSelectCellRenderer({
		FallbackRenderer: FieldFallbackView,
	}),
})
