import { Box, Checkbox, Dropdown, DropdownProps, FieldContainer, TableColumnsIcon } from '@contember/ui'
import { Fragment, ReactElement, useMemo } from 'react'
import type { MessageFormatter } from '../../../../../i18n'
import type { DataGridSetIsColumnHidden } from './DataGridSetIsColumnHidden'
import type { DataGridState } from './DataGridState'
import type { DataGridDictionary } from './dataGridDictionary'

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
	const buttonProps: DropdownProps['buttonProps'] = useMemo(() => ({
		intent: 'default',
		distinction: 'seamless',
		children: (
			<>
				<TableColumnsIcon />
				{formatMessage('dataGrid.columnHiding.showMenuButton.text')}
			</>
		),
		size: 'small',
	}), [formatMessage])

	return (
		<Dropdown buttonProps={buttonProps}>
			<Box border={false} label={formatMessage('dataGrid.columnHiding.heading')}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '0.25em' }}>
					{Array.from(desiredState.columns, ([key, column]) => {
						if (column.canBeHidden === false) {
							return <Fragment key={key} />
						}
						return (
							<FieldContainer
								key={key}
								display="inline"
								label={column.header}
								labelPosition="right"
							>
								<Checkbox
									notNull
									value={!desiredState.hiddenColumns[key]}
									onChange={isChecked => setIsColumnHidden(key, !isChecked)}
								/>
							</FieldContainer>
						)
					})}
				</div>
			</Box>
		</Dropdown>
	)
}
