import { memo } from 'react'
import { Stack } from '@contember/ui'
import { DataGridHeader, DataGridHeaderPublicProps } from './DataGridHeader'
import { DataGridContent, DataGridContentPublicProps } from './DataGridContent'
import { DataGridFooter, DataGridFooterPublicProps } from './DataGridFooter'
import { useClassName } from '@contember/react-utils'

export type DataGridContainerPublicProps =
	& DataGridHeaderPublicProps
	& DataGridContentPublicProps
	& DataGridFooterPublicProps

export type DataGridContainerProps =
	& DataGridContainerPublicProps

export const DataGridContainer = memo<& DataGridContainerProps>(props => {
	return (
		<Stack className={`${(useClassName('data-grid-body'))}-body`}>
			<DataGridHeader {...props} />
			<DataGridContent {...props} />
			<DataGridFooter />
		</Stack>
	)
})
