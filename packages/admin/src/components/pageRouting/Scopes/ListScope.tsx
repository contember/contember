import {
	EntityListSubTree,
	EntityListSubTreeAdditionalProps,
	SugaredQualifiedEntityList,
} from '@contember/binding'
import { ReactElement, ReactNode, memo } from 'react'
import { ImmutableEntityListRenderer } from '../../bindingFacade'
import type { PageProvider } from '../Pages'

export type ListScopeProps =
	& SugaredQualifiedEntityList
	& EntityListSubTreeAdditionalProps
	& {
		children?: ReactNode
	}

export const ListScope = memo(
	({
		children,
		...entityListProps
	}: ListScopeProps) => (
		<EntityListSubTree {...entityListProps} listComponent={ImmutableEntityListRenderer}>
			{children}
		</EntityListSubTree>
	),
) as ((props: ListScopeProps) => ReactElement) & Partial<PageProvider<ListScopeProps>>
