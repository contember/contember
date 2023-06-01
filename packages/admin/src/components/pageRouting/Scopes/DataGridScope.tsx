import { DataBindingProvider } from '@contember/binding'
import { memo, ReactNode } from 'react'
import { DataGrid, DataGridPageRenderer, DataGridProps, FeedbackRenderer, LayoutRendererProps } from '../../bindingFacade'
import { DataGridPageProps } from '../pageComponents'
import { scopeComponent } from './scopeComponent'

export type DataGridScopeProps =
	& DataGridProps<{}>
	& {
		pageName?: string
		children?: ReactNode
		rendererProps?: Omit<LayoutRendererProps, 'children'>
	}

/**
 * @group Scopes
 */
export const DataGridScope = scopeComponent(({
		children,
		rendererProps,
		pageName,
		...dataGridProps
	}: DataGridPageProps) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<DataGrid {...dataGridProps} component={DataGridPageRenderer} componentProps={rendererProps}>
				{children}
			</DataGrid>
		</DataBindingProvider>
	),
	'DataGridPage',
)
