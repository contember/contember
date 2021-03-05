import {
	DataBindingProvider,
	EntityListSubTree,
	EntityListSubTreeAdditionalProps,
	SugaredQualifiedEntityList,
} from '@contember/binding'
import { memo, ReactElement, ReactNode } from 'react'
import { FeedbackRenderer, ListRenderer, ListRendererProps } from '../bindingFacade'
import { PageProvider } from './PageProvider'

export interface ListPageProps<ContainerExtraProps, ItemExtraProps>
	extends SugaredQualifiedEntityList,
		EntityListSubTreeAdditionalProps {
	pageName: string
	children?: ReactNode
	rendererProps?: Omit<ListRendererProps<ContainerExtraProps, ItemExtraProps>, 'accessor' | 'children'>
}

const ListPage = memo(
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
) => ReactElement) &
	Partial<PageProvider<ListPageProps<never, never>>>

ListPage.getPageName = (props: ListPageProps<never, never>) => props.pageName

export { ListPage }
