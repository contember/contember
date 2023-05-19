import {
	DataBindingProvider,
	EntitySubTree,
	EntitySubTreeAdditionalProps,
	SugaredQualifiedSingleEntity,
} from '@contember/binding'
import { ComponentType, ReactNode, memo } from 'react'
import { FeedbackRenderer } from '../../bindingFacade'
import type { PageProvider } from '../Pages'
import { NotFoundBoundary } from './NotFoundBoundary'

export type DetailScopeProps =
	& SugaredQualifiedSingleEntity
	& EntitySubTreeAdditionalProps
	& {
		children: ReactNode
	}

export const DetailScope: Partial<DetailScopeProps> & ComponentType<DetailScopeProps> = memo(
	({ children, ...entityProps }: DetailScopeProps) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<EntitySubTree {...entityProps}>
				<NotFoundBoundary>
					{children}
				</NotFoundBoundary>
			</EntitySubTree>
		</DataBindingProvider>
	),
)

DetailScope.displayName = 'DetailScope'
