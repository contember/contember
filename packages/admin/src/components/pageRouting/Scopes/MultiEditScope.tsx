import {
	DataBindingProvider,
	EntityListSubTree,
	EntityListSubTreeAdditionalProps,
	SugaredQualifiedEntityList,
} from '@contember/binding'
import { ReactElement, ReactNode, memo } from 'react'
import { FeedbackRenderer, MutableEntityListPageRenderer, MutableEntityListPageRendererProps } from '../../bindingFacade'
import type { PageProvider } from '../Pages'

export type MultiEditScopeProps<ContainerExtraProps, ItemExtraProps> =
	& SugaredQualifiedEntityList
	& EntityListSubTreeAdditionalProps
	& {
		pageName?: string
		children?: ReactNode
		rendererProps?: Omit<MutableEntityListPageRendererProps<ContainerExtraProps, ItemExtraProps>, 'accessor' | 'children'>
	}

export const MultiEditScope = memo(
	<ContainerExtraProps, ItemExtraProps>({
		children,
		rendererProps,
		pageName,
		...entityListProps
	}: MultiEditScopeProps<ContainerExtraProps, ItemExtraProps>) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<EntityListSubTree {...entityListProps} listComponent={MutableEntityListPageRenderer} listProps={rendererProps}>
				{children}
			</EntityListSubTree>
		</DataBindingProvider>
	),
) as (<ContainerExtraProps, ItemExtraProps>(
	props: MultiEditScopeProps<ContainerExtraProps, ItemExtraProps>,
) => ReactElement) &
	Partial<PageProvider<MultiEditScopeProps<never, never>>>
