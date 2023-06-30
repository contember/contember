import {
	DataBindingProvider,
	EntityListSubTree,
	EntityListSubTreeAdditionalProps,
	SugaredQualifiedEntityList,
} from '@contember/binding'
import { ReactNode } from 'react'
import {
	FeedbackRenderer,
	ImmutableEntityListPageRenderer,
	ImmutableEntityListPageRendererProps,
} from '../../bindingFacade'
import { pageComponent } from './pageComponent'

export type ListPageProps<ContainerExtraProps, ItemExtraProps> =
	& SugaredQualifiedEntityList
	& EntityListSubTreeAdditionalProps
	& {
		pageName?: string
		children?: ReactNode
		rendererProps?: Omit<ImmutableEntityListPageRendererProps<ContainerExtraProps, ItemExtraProps>, 'accessor' | 'children'>
	}

/**
 * @group Pages
 */
export const ListPage = pageComponent(
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
	'ListPage',
)
