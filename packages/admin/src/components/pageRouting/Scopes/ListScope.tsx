import {
	DataBindingProvider,
	EntityListSubTree,
	EntityListSubTreeAdditionalProps,
	SugaredQualifiedEntityList,
} from '@contember/binding'
import { ReactElement, ReactNode, memo } from 'react'
import { FeedbackRenderer, ImmutableEntityListRenderer } from '../../bindingFacade'
import type { PageProvider } from '../Pages'

export type ListScopeProps<ContainerExtraProps, ItemExtraProps> =
	& SugaredQualifiedEntityList
	& EntityListSubTreeAdditionalProps
	& {
		pageName?: string
		children?: ReactNode
	}

export const ListScope = memo(
	<ContainerExtraProps, ItemExtraProps>({
		children,
		pageName,
		...entityListProps
	}: ListScopeProps<ContainerExtraProps, ItemExtraProps>) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<EntityListSubTree {...entityListProps} listComponent={ImmutableEntityListRenderer}>
				{children}
			</EntityListSubTree>
		</DataBindingProvider>
	),
) as (<ContainerExtraProps, ItemExtraProps>(
	props: ListScopeProps<ContainerExtraProps, ItemExtraProps>,
) => ReactElement) &
	Partial<PageProvider<ListScopeProps<never, never>>>
