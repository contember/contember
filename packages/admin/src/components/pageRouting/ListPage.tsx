import * as React from 'react'
import { EntityListDataProvider } from '../../binding/coreComponents'
import { ListRenderer, ListRendererProps } from '../bindingFacade'
import { EntityListPageProps } from './EntityListPageProps'
import { PageProvider } from './PageProvider'

export interface ListPageProps extends EntityListPageProps {
	rendererProps?: Omit<ListRendererProps, 'children'>
}

const ListPage: Partial<PageProvider<ListPageProps>> & React.ComponentType<ListPageProps> = React.memo(
	({ children, rendererProps, pageName, ...entityListProps }: ListPageProps) => (
		<EntityListDataProvider {...entityListProps}>
			<ListRenderer {...rendererProps}>{children}</ListRenderer>
		</EntityListDataProvider>
	),
)

ListPage.displayName = 'ListPage'
ListPage.getPageName = (props: ListPageProps) => props.pageName

export { ListPage }
