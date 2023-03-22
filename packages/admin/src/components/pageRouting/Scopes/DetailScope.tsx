import {
	DataBindingProvider,
	EntitySubTree,
	EntitySubTreeAdditionalProps,
	SugaredQualifiedSingleEntity,
} from '@contember/binding'
import { ComponentType, ReactNode, memo } from 'react'
import { FeedbackRenderer, LayoutRenderer, LayoutRendererProps } from '../../bindingFacade'
import type { PageProvider } from '../Pages'
import { getPageName } from '../pageComponents/getPageName'
import { NotFoundBoundary } from './NotFoundBoundary'

export type DetailScopeProps =
	& SugaredQualifiedSingleEntity
	& EntitySubTreeAdditionalProps
	& {
		pageName?: string
		children: ReactNode
	}

export const DetailScope: Partial<PageProvider<DetailScopeProps>> & ComponentType<DetailScopeProps> = memo(
	({ pageName, children, ...entityProps }: DetailScopeProps) => (
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
