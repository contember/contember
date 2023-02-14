import { DataBindingProvider } from '@contember/react-binding'
import { ReactNode } from 'react'
import {
	createDataGrid,
	createDataGridRenderer,
	DataGridColumnPublicProps,
	DataGridContainerPublicProps,
	DataGridPageRenderer,
	DataGridProps,
	FeedbackRenderer,
	LayoutRendererProps,
} from '../../bindingFacade'
import { pageComponent } from './pageComponent'
import { ContainerSpinner } from '@contember/ui'

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
		StaticRender: props => <>{props.tile}</>,
		ColumnStaticRender: props => <>{props.column.header}</>,
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
