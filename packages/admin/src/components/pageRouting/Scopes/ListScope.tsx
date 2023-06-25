import { DataBindingProvider, DataBindingProviderStateComponent, EntityListSubTree, EntityListSubTreeAdditionalProps, SugaredQualifiedEntityList } from '@contember/binding'
import { ReactNode } from 'react'
import { FeedbackRenderer, ImmutableEntityListRenderer, ImmutableEntityListRendererProps } from '../../bindingFacade'
import { scopeComponent } from './scopeComponent'

export type ListScopeProps<ContainerExtraProps, ItemExtraProps, StateProps> =
	& SugaredQualifiedEntityList
	& EntityListSubTreeAdditionalProps
	& DataBindingProviderStateComponent<StateProps>
	& {
		children?: ReactNode
		listProps?: Omit<ImmutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps>, 'accessor' | 'children'>
	}

/**
 * @group Scopes
 */
export const ListScope = scopeComponent(
	<ContainerExtraProps, ItemExtraProps, StateProps>({
		children,
		stateComponent,
		stateProps,
		...entityListProps
	}: ListScopeProps<ContainerExtraProps, ItemExtraProps, StateProps>) => (
		<DataBindingProvider stateComponent={stateComponent ?? FeedbackRenderer} stateProps={stateProps}>
			<EntityListSubTree {...entityListProps} listComponent={ImmutableEntityListRenderer}>
				{children}
			</EntityListSubTree>
		</DataBindingProvider>
	),
	'ListScope',
)
