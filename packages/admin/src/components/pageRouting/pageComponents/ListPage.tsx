import {
	DataBindingProvider,
	EntityListSubTree,
	EntityListSubTreeAdditionalProps,
	SugaredQualifiedEntityList,
} from '@contember/binding'
import { memo, ReactElement, ReactNode } from 'react'
import { FeedbackRenderer, ImmutableEntityListPageRenderer, ImmutableEntityListPageRendererProps } from '../../bindingFacade'
import type { PageProvider } from '../Pages'
import { getPageName } from './getPageName'

export type ListPageProps<ContainerExtraProps, ItemExtraProps> =
	& SugaredQualifiedEntityList
	& EntityListSubTreeAdditionalProps
	& {
		pageName?: string
		children?: ReactNode
		rendererProps?: Omit<ImmutableEntityListPageRendererProps<ContainerExtraProps, ItemExtraProps>, 'accessor' | 'children'>
	}

const ListPage = memo(
	<ContainerExtraProps, ItemExtraProps>({
		children,
		rendererProps,
		pageName,
		...entityListProps
	}: ListPageProps<ContainerExtraProps, ItemExtraProps>) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<EntityListSubTree {...entityListProps} listComponent={ImmutableEntityListPageRenderer} listProps={rendererProps}>
				{children}
			</EntityListSubTree>
		</DataBindingProvider>
	),
) as (<ContainerExtraProps, ItemExtraProps>(
	props: ListPageProps<ContainerExtraProps, ItemExtraProps>,
) => ReactElement) &
	Partial<PageProvider<ListPageProps<never, never>>>

ListPage.getPageName = getPageName

export { ListPage }
