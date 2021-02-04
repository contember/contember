import { Box, Dropdown, Icon } from '@contember/ui'
import * as React from 'react'
import { Checkbox } from '../../../../ui'
import { DataGridSetIsColumnHidden } from './DataGridSetIsColumnHidden'
import { DataGridState } from './DataGridState'

export interface DataGridColumnHidingProps {
	desiredState: DataGridState
	setIsColumnHidden: DataGridSetIsColumnHidden
}

export function DataGridColumnHiding({
	desiredState,
	setIsColumnHidden,
}: DataGridColumnHidingProps): React.ReactElement | null {
	return (
		<Dropdown
			alignment="end"
			buttonProps={{
				intent: 'default',
				distinction: 'seamless',
				children: (
					<>
						<Icon blueprintIcon="list-columns" alignWithLowercase style={{ marginRight: '0.4em' }} />
						Columns
					</>
				),
			}}
		>
			<Box heading="Columns">
				{Array.from(desiredState.columns, ([key, column]) => {
					if (column.canBeHidden === false) {
						return <React.Fragment key={key} />
					}
					return (
						<Checkbox
							key={key}
							checked={!desiredState.hiddenColumns.has(key)}
							onChange={isChecked => setIsColumnHidden(key, !isChecked)}
						>
							{column.header}
						</Checkbox>
					)
				})}
			</Box>
		</Dropdown>
	)
}
