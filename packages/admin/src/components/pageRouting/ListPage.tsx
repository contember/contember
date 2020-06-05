import { DataBindingProvider, EntityListSubTree, SugaredQualifiedEntityList } from '@contember/binding'
import * as React from 'react'
import { FeedbackRenderer, ListRenderer, ListRendererProps } from '../bindingFacade'
import { PageProvider } from './PageProvider'

export interface ListPageProps<ContainerExtraProps, ItemExtraProps> extends SugaredQualifiedEntityList {
	pageName: string
	children?: React.ReactNode
	rendererProps?: Omit<ListRendererProps<ContainerExtraProps, ItemExtraProps>, 'accessor' | 'children'>
}

const ListPage = React.memo(
	<ContainerExtraProps, ItemExtraProps>({
		children,
		rendererProps,
		pageName,
		...entityListProps
	}: ListPageProps<ContainerExtraProps, ItemExtraProps>) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<EntityListSubTree {...entityListProps} listComponent={ListRenderer} listProps={rendererProps}>
				{children}
			</EntityListSubTree>
		</DataBindingProvider>
	),
) as (<ContainerExtraProps, ItemExtraProps>(
	props: ListPageProps<ContainerExtraProps, ItemExtraProps>,
) => React.ReactElement) &
	Partial<PageProvider<ListPageProps<never, never>>>

ListPage.getPageName = (props: ListPageProps<never, never>) => props.pageName

export { ListPage }
