import { DataBindingProvider } from '@contember/binding'
import { ComponentType, memo, ReactNode } from 'react'
import { DataGrid, DataGridProps, FeedbackRenderer, LayoutRenderer, LayoutRendererProps } from '../../bindingFacade'
import type { PageProvider } from '../Pages'
import { getPageName } from './getPageName'

export type DataGridPageProps =
	& DataGridProps
	& {
		pageName?: string
		children?: ReactNode
		rendererProps?: Omit<LayoutRendererProps, 'children'>
	}

const DataGridPage: Partial<PageProvider<DataGridPageProps>> & ComponentType<DataGridPageProps> = memo(({
		children,
		rendererProps,
		pageName,
		...dataGridProps
	}: DataGridPageProps) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<LayoutRenderer {...rendererProps}>
				<DataGrid {...dataGridProps}>
					{children}
				</DataGrid>
			</LayoutRenderer>
		</DataBindingProvider>
	),
)
DataGridPage.displayName = 'DataGridPage'
DataGridPage.getPageName = getPageName

export { DataGridPage }
