import { Button, ButtonList, Divider, LayoutPageStickyContainer, Stack, TableRowsIcon } from '@contember/ui'
import { LayoutGridIcon } from 'lucide-react'
import { ReactNode, memo, useCallback } from 'react'
import { useMessageFormatter } from '../../../../../../i18n'
import { DataGridColumnHiding } from '../DataGridColumnHiding'
import { DataGridFullFilters } from '../DataGridFullFilters'
import { dataGridDictionary } from '../dataGridDictionary'
import { DataGridContainerProps } from './Types'

interface DataGridContainerHeaderProps
	extends Pick<
		DataGridContainerProps,
		| 'accessor'
		| 'allowAggregateFilterControls'
		| 'allowColumnVisibilityControls'
		| 'desiredState'
		| 'setFilter'
		| 'setIsColumnHidden'
		| 'setLayout'
	> {
		hasTile: boolean
		pagingSummary: ReactNode
	}

export const DataGridContainerHeader = memo<DataGridContainerHeaderProps>(({
	accessor,
	allowAggregateFilterControls,
	allowColumnVisibilityControls,
	desiredState,
	hasTile,
	pagingSummary,
	setFilter,
	setIsColumnHidden,
	setLayout,
}) => {
	const { layout } = desiredState
	const formatMessage = useMessageFormatter(dataGridDictionary)

	const setDefaultView = useCallback(() => setLayout('default'), [setLayout])
	const setTileView = useCallback(() => setLayout('tiles'), [setLayout])

	return (
		<LayoutPageStickyContainer
			left="var(--cui-layout-page--padding-left)"
			right="var(--cui-layout-page--padding-right)"
		>
			<Stack wrap align="center" horizontal justify="space-between">
				<Stack gap="gutter" horizontal>
					{hasTile && <>
						<ButtonList gap="gutter">
							<Button onClick={setTileView} size="small" distinction="seamless" intent={layout === 'tiles' ? undefined : 'default'}>
								<LayoutGridIcon />
							</Button>
							<Button onClick={setDefaultView} size="small" distinction="seamless" intent={layout === 'default' ? undefined : 'default'}>
								<TableRowsIcon />
							</Button>
						</ButtonList>

						<Divider gap={false} />
					</>}
					{layout !== 'tiles' && allowColumnVisibilityControls !== false && (
							<DataGridColumnHiding
								desiredState={desiredState}
								formatMessage={formatMessage}
								setIsColumnHidden={setIsColumnHidden}
							/>
						)
					}
					{allowAggregateFilterControls !== false && (
						<DataGridFullFilters
							desiredState={desiredState}
							environment={accessor.environment}
							formatMessage={formatMessage}
							setFilter={setFilter}
						/>
					)}
				</Stack>
				<div>{pagingSummary}</div>
			</Stack>
		</LayoutPageStickyContainer>
	)
})
DataGridContainerHeader.displayName = 'DataGridContainerHeader'
