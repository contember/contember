import { lcfirst } from 'cms-common'
import * as React from 'react'
import { EntityListDataProvider } from '../../binding/coreComponents'
import { TableRenderer, TableRendererProps } from '../bindingFacade'
import { EntityListPageProps } from './EntityListPageProps'
import { PageProvider } from './PageProvider'

export interface TablePageProps extends EntityListPageProps {
	rendererProps?: Omit<TableRendererProps, 'children'>
}

const TablePage: Partial<PageProvider<TablePageProps>> & React.ComponentType<TablePageProps> = React.memo(
	(props: TablePageProps) => (
		<EntityListDataProvider
			entityName={props.entityName}
			orderBy={props.orderBy}
			offset={props.offset}
			limit={props.limit}
			filter={props.filter}
		>
			<TableRenderer {...props.rendererProps}>{props.children}</TableRenderer>
		</EntityListDataProvider>
	),
)

TablePage.displayName = 'TablePage'
TablePage.getPageName = (props: TablePageProps) => props.pageName || `table_${lcfirst(props.entityName)}`

export { TablePage }
