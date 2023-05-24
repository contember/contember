import { createCoalesceTextCell } from '@contember/react-datagrid'
import { GenericTextCellFilter } from '../filters'
import { CoalesceFieldView, CoalesceFieldViewProps } from '@contember/react-binding-ui'
import { Stack } from '@contember/ui'
import { DataGridColumnPublicProps } from '../types'

/**
 * DataGrid cells with for text fields with a fallback support.
 *
 * @example
 * ```
 * <CoalesceTextCell fields={['email', 'user.email']} header="E-mail" />
 * ```
 *
 * @group Data grid
 */
export const CoalesceTextCell = createCoalesceTextCell<DataGridColumnPublicProps, CoalesceFieldViewProps>({
	FilterRenderer: props => {
		return (
			<Stack horizontal align="center">
				<GenericTextCellFilter {...props} />
			</Stack>
		)
	},
	ValueRenderer: CoalesceFieldView,
})
