import * as React from 'react'
import { EntityListDataProvider } from '@contember/binding'
import { TableRenderer, TableRendererProps } from '../bindingFacade'
import { EntityListPageProps } from './EntityListPageProps'
import { PageProvider } from './PageProvider'

export interface TablePageProps extends EntityListPageProps {
	rendererProps?: Omit<TableRendererProps, 'children'>
}

const TablePage: Partial<PageProvider<TablePageProps>> & React.ComponentType<TablePageProps> = React.memo(
	({ rendererProps, children, pageName, ...entityListProps }: TablePageProps) => (
		<EntityListDataProvider {...entityListProps}>
			<TableRenderer {...rendererProps}>{children}</TableRenderer>
		</EntityListDataProvider>
	),
)

TablePage.displayName = 'TablePage'
TablePage.getPageName = (props: TablePageProps) => props.pageName

export { TablePage }
