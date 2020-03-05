import * as React from 'react'
import { EntityListDataProvider } from '@contember/binding'
import { TableRenderer, TableRendererProps } from '../bindingFacade'
import { EntityListPageProps } from './EntityListPageProps'
import { PageProvider } from './PageProvider'

export interface TablePageProps<ContainerExtraProps, ItemExtraProps> extends EntityListPageProps {
	rendererProps?: Omit<TableRendererProps<ContainerExtraProps, ItemExtraProps>, 'children'>
}

const TablePage = React.memo(
	<ContainerExtraProps, ItemExtraProps>({
		rendererProps,
		children,
		pageName,
		...entityListProps
	}: TablePageProps<ContainerExtraProps, ItemExtraProps>) => (
		<EntityListDataProvider {...entityListProps}>
			<TableRenderer {...rendererProps}>{children}</TableRenderer>
		</EntityListDataProvider>
	),
) as (<ContainerExtraProps, ItemExtraProps>(
	props: TablePageProps<ContainerExtraProps, ItemExtraProps>,
) => React.ReactElement) &
	Partial<PageProvider<TablePageProps<never, never>>>

TablePage.getPageName = (props: TablePageProps<never, never>) => props.pageName

export { TablePage }
