import * as React from 'react'
import { EntityListDataProvider } from '@contember/binding'
import { ListRenderer, ListRendererProps } from '../bindingFacade'
import { EntityListPageProps } from './EntityListPageProps'
import { PageProvider } from './PageProvider'

export interface ListPageProps<ContainerExtraProps, ItemExtraProps> extends EntityListPageProps {
	rendererProps?: Omit<ListRendererProps<ContainerExtraProps, ItemExtraProps>, 'children'>
}

const ListPage = React.memo(
	<ContainerExtraProps, ItemExtraProps>({
		children,
		rendererProps,
		pageName,
		...entityListProps
	}: ListPageProps<ContainerExtraProps, ItemExtraProps>) => (
		<EntityListDataProvider {...entityListProps}>
			<ListRenderer {...rendererProps}>{children}</ListRenderer>
		</EntityListDataProvider>
	),
) as (<ContainerExtraProps, ItemExtraProps>(
	props: ListPageProps<ContainerExtraProps, ItemExtraProps>,
) => React.ReactElement) &
	Partial<PageProvider<ListPageProps<never, never>>>

ListPage.getPageName = (props: ListPageProps<never, never>) => props.pageName

export { ListPage }
