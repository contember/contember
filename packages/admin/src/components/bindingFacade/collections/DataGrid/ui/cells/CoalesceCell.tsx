import { createCoalesceCell } from '../../cells'
import { GenericTextCellFilter } from '../filters'
import { CoalesceFieldView, CoalesceFieldViewProps } from '../../../../fieldViews'
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
export const CoalesceCell = createCoalesceCell<DataGridColumnPublicProps, CoalesceFieldViewProps>({
	FilterRenderer: props => {
		return (
			<Stack horizontal align="center">
				<GenericTextCellFilter {...props} />
			</Stack>
		)
	},
	ValueRenderer: CoalesceFieldView,
})
