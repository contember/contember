import { Box, Checkbox, Dropdown, DropdownProps, FieldContainer, TableColumnsIcon, Text } from '@contember/ui'
import { Fragment, ReactElement, useMemo } from 'react'
import { useMessageFormatter } from '@contember/react-i18n'
import { dataGridDictionary } from '../dict/dataGridDictionary'
import { useDataGridColumns, useDataGridHiddenColumns, useDataGridLayout, useDataGridSetColumnHidden } from '@contember/react-datagrid'
import { DataGridColumnPublicProps } from '../types'

export type DataGridColumnHidingPublicProps = {
	allowColumnVisibilityControls?: boolean
}

export type DataGridColumnHidingProps =
	& DataGridColumnHidingPublicProps

export const DataGridColumnHiding = ({
	allowColumnVisibilityControls,
}: DataGridColumnHidingProps): ReactElement | null => {
	const formatMessage = useMessageFormatter(dataGridDictionary)
	const setIsColumnHidden = useDataGridSetColumnHidden()
	const layout = useDataGridLayout()
	const columns = useDataGridColumns<DataGridColumnPublicProps>()
	const hiding = useDataGridHiddenColumns()
	const buttonProps: DropdownProps['buttonProps'] = useMemo(() => ({
		intent: 'default',
		distinction: 'seamless',
		children: (
			<>
				<TableColumnsIcon />
				<Text translate={formatMessage}>dataGrid.columnHiding.showMenuButton.text</Text>
			</>
		),
		size: 'small',
	}), [formatMessage])

	if (allowColumnVisibilityControls === false || layout === 'tiles') {
		return null
	}

	return (
		<Dropdown buttonProps={buttonProps}>
			<Box border={false} label={<Text>{formatMessage('dataGrid.columnHiding.heading')}</Text>}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '0.25em' }}>
					{Array.from(columns, ([key, column]) => {
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
									value={!hiding[key]}
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
