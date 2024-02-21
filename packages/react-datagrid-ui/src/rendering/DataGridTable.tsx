import { Table, TableCell, TableRow } from '@contember/ui'
import { ComponentType, memo, ReactNode } from 'react'
import { useMessageFormatter } from '@contember/react-i18n'
import { EmptyMessage, EmptyMessageProps } from '@contember/react-binding-ui'
import { dataGridDictionary } from '../dict/dataGridDictionary'
import { DataGridTableRow, DataGridTableRowPublicProps } from './DataGridTableRow'
import { DataGridTableHead } from './DataGridTableHead'
import { useClassName } from '@contember/react-utils'
import { useDataGridColumns } from '@contember/react-datagrid'
import { DataViewEachRow, DataViewEmpty } from '@contember/react-dataview'

export type DataGridTablePublicProps =
	& {
		emptyMessage?: ReactNode
		emptyMessageComponent?: ComponentType<EmptyMessageProps & any> // This can override 'emptyMessage'
	}
	& DataGridTableRowPublicProps

export type DataGridTableProps =
	& DataGridTablePublicProps

export const DataGridTable = memo<DataGridTableProps>(props => {
	const {
		emptyMessage,
		emptyMessageComponent,
	} = props

	const columns = useDataGridColumns()

	const formatMessage = useMessageFormatter(dataGridDictionary)

	return (
		<Table
			className={useClassName('data-grid-body-content--table')}
			tableHead={<DataGridTableHead />}
		>
			<DataViewEmpty>
				<TableRow>
					<TableCell colSpan={columns.size}>
						<EmptyMessage
							border={false}
							component={emptyMessageComponent}
						>
							{formatMessage(emptyMessage, 'dataGrid.emptyMessage.text')}
						</EmptyMessage>
					</TableCell>
				</TableRow>
			</DataViewEmpty>
			<DataViewEachRow>
				<DataGridTableRow {...props} />
			</DataViewEachRow>
		</Table>
	)
})
DataGridTable.displayName = 'DataGridTable'
