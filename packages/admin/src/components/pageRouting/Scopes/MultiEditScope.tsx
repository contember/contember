import { DataBindingProvider, DataBindingProviderStateComponent, EntityListSubTree, EntityListSubTreeAdditionalProps, SugaredQualifiedEntityList } from '@contember/binding'
import { ReactNode } from 'react'
import { FeedbackRenderer, MutableEntityListRenderer, MutableEntityListRendererProps } from '../../bindingFacade'
import { scopeComponent } from './scopeComponent'

export type MultiEditScopeProps<ContainerExtraProps, ItemExtraProps, StateManagerProps> =
	& SugaredQualifiedEntityList
	& EntityListSubTreeAdditionalProps
	& DataBindingProviderStateComponent<StateManagerProps>
	& {
		children?: ReactNode
		refreshDataBindingOnPersist?: boolean
		skipBindingStateUpdateAfterPersist?: boolean
		listProps?: Omit<MutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps>, 'accessor' | 'children'>
	}
/**
 * @group Scopes
 */
export const MultiEditScope = scopeComponent(
	<ContainerExtraProps, ItemExtraProps, StateManagerProps>({
		children,
		refreshDataBindingOnPersist,
		skipBindingStateUpdateAfterPersist,
		stateComponent,
		stateProps,
		...entityListProps
	}: MultiEditScopeProps<ContainerExtraProps, ItemExtraProps, StateManagerProps>) => (
		<DataBindingProvider
			stateComponent={stateComponent ?? FeedbackRenderer}
			stateProps={stateProps}
			refreshOnPersist={refreshDataBindingOnPersist ?? true}
			skipStateUpdateAfterPersist={skipBindingStateUpdateAfterPersist}
		>
			<EntityListSubTree {...entityListProps} listComponent={MutableEntityListRenderer}>
				{children}
			</EntityListSubTree>
		</DataBindingProvider>
	),
	'MultiEditScope',
)
