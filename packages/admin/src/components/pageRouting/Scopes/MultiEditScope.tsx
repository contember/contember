import {
	EntityListSubTree,
	EntityListSubTreeAdditionalProps,
	SugaredQualifiedEntityList,
} from '@contember/binding'
import { ReactElement, ReactNode, memo } from 'react'
import { MutableEntityListPageRenderer } from '../../bindingFacade'
import type { PageProvider } from '../Pages'

export type MultiEditScopeProps =
	& SugaredQualifiedEntityList
	& EntityListSubTreeAdditionalProps
	& {
		children?: ReactNode
	}

export const MultiEditScope = memo(
	({
		children,
		...entityListProps
	}: MultiEditScopeProps) => (
		<EntityListSubTree {...entityListProps} listComponent={MutableEntityListPageRenderer}>
			{children}
		</EntityListSubTree>
	),
) as ((props: MultiEditScopeProps) => ReactElement) & Partial<PageProvider<MultiEditScopeProps>>
