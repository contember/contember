import { Box, Checkbox, Dropdown, DropdownProps, FieldContainer, TableColumnsIcon, Text } from '@contember/ui'
import { Fragment, ReactElement, useMemo } from 'react'
import { useMessageFormatter } from '@contember/react-i18n'
import { dataGridDictionary } from '../dict/dataGridDictionary'
import { DataGridRenderingCommonProps } from '../types'

export type DataGridColumnHidingPublicProps = {
	allowColumnVisibilityControls?: boolean
}

export type DataGridColumnHidingProps =
	& DataGridRenderingCommonProps
	& DataGridColumnHidingPublicProps

export const DataGridColumnHiding = ({
	desiredState,
	displayedState,
	stateMethods: { setIsColumnHidden },
	allowColumnVisibilityControls,
}: DataGridColumnHidingProps): ReactElement | null => {
	const formatMessage = useMessageFormatter(dataGridDictionary)
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

	if (!allowColumnVisibilityControls || displayedState.layout === 'tiles') {
		return null
	}

	return (
		<Dropdown buttonProps={buttonProps}>
			<Box border={false} label={<Text translate={formatMessage}>dataGrid.columnHiding.heading</Text>}>
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
