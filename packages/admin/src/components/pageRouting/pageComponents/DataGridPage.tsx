import { DataBindingProvider } from '@contember/react-binding'
import { ReactNode } from 'react'
import {
	DataGridPageRenderer,
	FeedbackRenderer,
	LayoutRendererProps,
} from '../../bindingFacade'
import { pageComponent } from './pageComponent'
import { ContainerSpinner } from '@contember/ui'
import { DataGridProps, DataGridContainerPublicProps, createDataGrid, createDataGridRenderer, DataGridColumnPublicProps } from '@contember/react-datagrid-ui'

export type DataGridPageProps =
	& DataGridProps<DataGridContainerPublicProps>
	& {
		pageName?: string
		children?: ReactNode
		rendererProps?: Omit<LayoutRendererProps, 'children'>
	}
const DataGridForPage = createDataGrid(createDataGridRenderer<DataGridColumnPublicProps, DataGridContainerPublicProps>({
		Fallback: ContainerSpinner,
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
		pageName,
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
