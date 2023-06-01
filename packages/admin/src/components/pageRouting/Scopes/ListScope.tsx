import { DataBindingProvider, EntityListSubTree, EntityListSubTreeAdditionalProps, SugaredQualifiedEntityList } from '@contember/binding'
import { ReactNode } from 'react'
import { FeedbackRenderer, ImmutableEntityListRenderer, ImmutableEntityListRendererProps } from '../../bindingFacade'
import { scopeComponent } from './scopeComponent'

export type ListScopeProps<ContainerExtraProps, ItemExtraProps> =
	& SugaredQualifiedEntityList
	& EntityListSubTreeAdditionalProps
	& {
		children?: ReactNode
		listProps?: Omit<ImmutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps>, 'accessor' | 'children'>
	}

/**
 * @group Scopes
 */
export const ListScope = scopeComponent(
	<ContainerExtraProps, ItemExtraProps>({
		children,
		...entityListProps
	}: ListScopeProps<ContainerExtraProps, ItemExtraProps>) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<EntityListSubTree {...entityListProps} listComponent={ImmutableEntityListRenderer}>
				{children}
			</EntityListSubTree>
		</DataBindingProvider>
	),
	'ListScope',
)
