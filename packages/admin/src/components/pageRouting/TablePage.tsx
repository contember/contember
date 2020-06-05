import { DataBindingProvider, EntityListSubTree, SugaredQualifiedEntityList } from '@contember/binding'
import * as React from 'react'
import { FeedbackRenderer, TableRenderer, TableRendererProps } from '../bindingFacade'
import { PageProvider } from './PageProvider'

export interface TablePageProps<ContainerExtraProps, ItemExtraProps> extends SugaredQualifiedEntityList {
	pageName: string
	children?: React.ReactNode
	rendererProps?: Omit<TableRendererProps<ContainerExtraProps, ItemExtraProps>, 'children'>
}

const TablePage = React.memo(
	<ContainerExtraProps, ItemExtraProps>({
		rendererProps,
		children,
		pageName,
		...entityListProps
	}: TablePageProps<ContainerExtraProps, ItemExtraProps>) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<EntityListSubTree {...entityListProps} listComponent={TableRenderer} listProps={rendererProps}>
				{children}
			</EntityListSubTree>
		</DataBindingProvider>
	),
) as (<ContainerExtraProps, ItemExtraProps>(
	props: TablePageProps<ContainerExtraProps, ItemExtraProps>,
) => React.ReactElement) &
	Partial<PageProvider<TablePageProps<never, never>>>

TablePage.getPageName = (props: TablePageProps<never, never>) => props.pageName

export { TablePage }
