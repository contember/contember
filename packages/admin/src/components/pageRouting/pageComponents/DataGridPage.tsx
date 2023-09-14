import { DataBindingProvider } from '@contember/react-binding'
import { DataGridColumnPublicProps, DataGridContainerPublicProps, DataGridProps, createDataGrid, createDataGridRenderer } from '@contember/react-datagrid-ui'
import { SpinnerContainer } from '@contember/ui'
import { ReactNode } from 'react'
import {
	DataGridPageRenderer,
	FeedbackRenderer,
	LayoutRendererProps,
} from '../../bindingFacade'
import { pageComponent } from './pageComponent'

export type DataGridPageProps =
	& DataGridProps<DataGridContainerPublicProps>
	& {
		pageName?: string
		children?: ReactNode
		rendererProps?: Omit<LayoutRendererProps, 'children'>
	}
const DataGridForPage = createDataGrid(createDataGridRenderer<DataGridColumnPublicProps, DataGridContainerPublicProps>({
	Fallback: SpinnerContainer,
	Container: DataGridPageRenderer,
	staticRender: props => <>{props.tile}</>,
	columnStaticRender: props => <>{props.column.header}</>,
}),
)

/**
 * @group Pages
 */
export const DataGridPage = pageComponent(({
	children,
	rendererProps,
	pageName: _INTENTIONALLY_OMITTED_pageName,
	...dataGridProps
}: DataGridPageProps) => (
	<DataBindingProvider stateComponent={FeedbackRenderer}>
		<DataGridForPage {...dataGridProps} {...rendererProps}>
			{children}
		</DataGridForPage>
	</DataBindingProvider>
),
	'DataGridPage',
)
