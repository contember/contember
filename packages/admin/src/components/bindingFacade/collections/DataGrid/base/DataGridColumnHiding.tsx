import { Box, Checkbox, Dropdown, Icon } from '@contember/ui'
import { Fragment, ReactElement } from 'react'
import { MessageFormatter } from '../../../../../i18n'
import { DataGridDictionary } from './dataGridDictionary'
import { DataGridSetIsColumnHidden } from './DataGridSetIsColumnHidden'
import { DataGridState } from './DataGridState'

export interface DataGridColumnHidingProps {
	desiredState: DataGridState
	formatMessage: MessageFormatter<DataGridDictionary>
	setIsColumnHidden: DataGridSetIsColumnHidden
}

export function DataGridColumnHiding({
	desiredState,
	formatMessage,
	setIsColumnHidden,
}: DataGridColumnHidingProps): ReactElement | null {
	return (
		<Dropdown
			alignment="end"
			buttonProps={{
				intent: 'default',
				distinction: 'seamless',
				children: (
					<>
						<Icon blueprintIcon="list-columns" alignWithLowercase style={{ marginRight: '0.4em' }} />
						{formatMessage('dataGrid.columnHiding.showMenuButton.text')}
					</>
				),
			}}
		>
			<Box heading={formatMessage('dataGrid.columnHiding.heading')}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '0.25em' }}>
					{Array.from(desiredState.columns, ([key, column]) => {
						if (column.canBeHidden === false) {
							return <Fragment key={key} />
						}
						return (
							<Checkbox
								key={key}
								value={!desiredState.hiddenColumns.has(key)}
								onChange={isChecked => setIsColumnHidden(key, !isChecked)}
							>
								{column.header}
							</Checkbox>
						)
					})}
				</div>
			</Box>
		</Dropdown>
	)
}
