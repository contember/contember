import { lcfirst } from '@contember/utils'
import * as React from 'react'
import { EntityListDataProvider } from '../../binding/coreComponents'
import { ListRenderer, ListRendererProps } from '../bindingFacade'
import { EntityListPageProps } from './EntityListPageProps'
import { PageProvider } from './PageProvider'

export interface ListPageProps extends EntityListPageProps {
	rendererProps?: Omit<ListRendererProps, 'children'>
}

const ListPage: Partial<PageProvider<ListPageProps>> & React.ComponentType<ListPageProps> = React.memo(
	(props: ListPageProps) => (
		<EntityListDataProvider
			entityName={props.entityName}
			orderBy={props.orderBy}
			offset={props.offset}
			limit={props.limit}
			filter={props.filter}
		>
			<ListRenderer {...props.rendererProps}>{props.children}</ListRenderer>
		</EntityListDataProvider>
	),
)

ListPage.displayName = 'ListPage'
ListPage.getPageName = (props: ListPageProps) => props.pageName || `list_${lcfirst(props.entityName)}`

export { ListPage }
