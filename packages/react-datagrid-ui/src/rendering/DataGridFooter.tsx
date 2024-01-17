import { Button, LayoutPageStickyContainer, Stack } from '@contember/ui'
import { memo } from 'react'
import { useMessageFormatter } from '@contember/react-i18n'
import { dataGridDictionary } from '../dict/dataGridDictionary'
import { DataGridPagingSummary } from './DataGridPagingSummary'
import { DataViewChangePageTrigger, useDataViewPagingInfo } from '@contember/react-dataview'

export type DataGridFooterPublicProps = {}

export type DataGridFooterProps =
	& DataGridFooterPublicProps

export const DataGridFooter = memo<DataGridFooterProps>(() => {
	const formatMessage = useMessageFormatter(dataGridDictionary)
	const pagesCount = useDataViewPagingInfo().pagesCount

	if (!pagesCount || pagesCount <= 1) {
		return null
	}

	return (
		<LayoutPageStickyContainer
			left="var(--cui-layout-page--padding-left)"
			right="var(--cui-layout-page--padding-right)"
		>
			<Stack wrap align="center" horizontal justify="space-between">
				<Stack horizontal justify="space-between" gap="gap">
					<DataViewChangePageTrigger page={'first'}>
						<Button
							distinction="seamless"
							inset={false}
						>
							{formatMessage('dataGrid.paging.first')}
						</Button>
					</DataViewChangePageTrigger>
					<DataViewChangePageTrigger page={'previous'}>
						<Button
							inset={false}
						>
							{formatMessage('dataGrid.paging.previous')}
						</Button>
					</DataViewChangePageTrigger>
					<DataViewChangePageTrigger page={'next'}>
						<Button
							inset={false}
						>
							{formatMessage('dataGrid.paging.next')}
						</Button>
					</DataViewChangePageTrigger>
					<DataViewChangePageTrigger page={'last'}>
						<Button
							inset={false}
						>
							{formatMessage('dataGrid.paging.last')}
						</Button>
					</DataViewChangePageTrigger>
				</Stack>
				<div><DataGridPagingSummary /></div>
			</Stack>
		</LayoutPageStickyContainer>
	)
})
DataGridFooter.displayName = 'DataGridFooter'
