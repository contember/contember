import {
	Component,
	DataBindingProvider,
	EntityListSubTree,
	EntityListSubTreeAdditionalProps,
	SugaredQualifiedEntityList,
} from '@contember/binding'
import { ReactElement, ReactNode } from 'react'
import { FeedbackRenderer, MutableEntityListRenderer, MutableEntityListRendererProps } from '../../bindingFacade'

export type MultiEditScopeProps<ContainerExtraProps, ItemExtraProps> =
	& SugaredQualifiedEntityList
	& EntityListSubTreeAdditionalProps
	& {
		children?: ReactNode
		refreshDataBindingOnPersist?: boolean
		skipBindingStateUpdateAfterPersist?: boolean
		listProps?: Omit<MutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps>, 'accessor' | 'children'>
	}

export const MultiEditScope = Component(
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
) as (<ContainerExtraProps, ItemExtraProps>(
	props: MultiEditScopeProps<ContainerExtraProps, ItemExtraProps>
) => ReactElement) &
	Partial<MultiEditScopeProps<never, never>> & {
		displayName?: string;
	}

MultiEditScope.displayName = 'MultiEditScope'
