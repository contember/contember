import { Entity, EntityListBaseProps } from '@contember/react-binding'
import { Table, TableCell, TableRow } from '@contember/ui'
import { ComponentType, memo, ReactNode } from 'react'
import { useMessageFormatter } from '../../../../../../i18n'
import { EmptyMessage, EmptyMessageProps } from '../../../helpers'
import { dataGridDictionary } from '../dict/dataGridDictionary'
import { DataGridRenderingCommonProps } from '../types'
import { DataGridTableRow, DataGridTableRowPublicProps } from './DataGridTableRow'
import { DataGridTableHead } from './DataGridTableHead'
import { useClassName } from '@contember/react-utils'

export type DataGridTablePublicProps =
	& {
		emptyMessage?: ReactNode
		emptyMessageComponent?: ComponentType<EmptyMessageProps & any> // This can override 'emptyMessage'
	}
	& DataGridTableRowPublicProps

type DataGridTableProps =
	& DataGridRenderingCommonProps
	& DataGridTablePublicProps
	& EntityListBaseProps

export const DataGridTable = memo<DataGridTableProps>(props => {
	const {
		accessor,
		desiredState: { columns },
		emptyMessage,
		emptyMessageComponent,
	} = props

	const formatMessage = useMessageFormatter(dataGridDictionary)

	return (
		<Table
			className={useClassName('data-grid-body-content--table')}
			tableHead={<DataGridTableHead {...props} />}
		>
			{accessor.length > 0
				? (
					Array.from(accessor, entity => (
						<Entity key={entity.key} accessor={entity}>
							<DataGridTableRow {...props} />
						</Entity>
					))
				)
				: (
					<TableRow>
						<TableCell colSpan={columns.size}>a
							<EmptyMessage
								border={false}
								component={emptyMessageComponent}
							>
								{formatMessage(emptyMessage, 'dataGrid.emptyMessage.text')}
							</EmptyMessage>
						</TableCell>
					</TableRow>
				)
			}
		</Table>
	)
})
DataGridTable.displayName = 'DataGridTable'
