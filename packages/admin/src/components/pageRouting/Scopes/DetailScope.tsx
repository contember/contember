import {
	EntitySubTree,
	EntitySubTreeAdditionalProps,
	SugaredQualifiedSingleEntity,
} from '@contember/binding'
import { ComponentType, ReactNode, memo } from 'react'
import type { PageProvider } from '../Pages'
import { NotFoundBoundary } from './NotFoundBoundary'

export type DetailScopeProps =
	& SugaredQualifiedSingleEntity
	& EntitySubTreeAdditionalProps
	& {
		children: ReactNode
	}

export const DetailScope: Partial<PageProvider<DetailScopeProps>> & ComponentType<DetailScopeProps> = memo(
	({ children, ...entityProps }: DetailScopeProps) => (
		<EntitySubTree {...entityProps}>
			<NotFoundBoundary>
				{children}
			</NotFoundBoundary>
		</EntitySubTree>
	),
)

DetailScope.displayName = 'DetailScope'
