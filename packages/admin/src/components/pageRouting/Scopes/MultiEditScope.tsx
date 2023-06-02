import { DataBindingProvider, EntityListSubTree, EntityListSubTreeAdditionalProps, SugaredQualifiedEntityList } from '@contember/binding'
import { ReactNode } from 'react'
import { FeedbackRenderer, MutableEntityListRenderer, MutableEntityListRendererProps } from '../../bindingFacade'
import { scopeComponent } from './scopeComponent'

export type MultiEditScopeProps<ContainerExtraProps, ItemExtraProps> =
	& SugaredQualifiedEntityList
	& EntityListSubTreeAdditionalProps
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
	<ContainerExtraProps, ItemExtraProps>({
		children,
		refreshDataBindingOnPersist, skipBindingStateUpdateAfterPersist,
		...entityListProps
	}: MultiEditScopeProps<ContainerExtraProps, ItemExtraProps>) => (
		<DataBindingProvider
			stateComponent={FeedbackRenderer}
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
