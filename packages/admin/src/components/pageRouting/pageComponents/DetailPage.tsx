import {
	DataBindingProvider,
	EntitySubTree,
	EntitySubTreeAdditionalProps,
	SugaredQualifiedSingleEntity,
} from '@contember/binding'
import { ComponentType, memo, ReactNode } from 'react'
import { FeedbackRenderer, LayoutRenderer, LayoutRendererProps } from '../../bindingFacade'
import type { PageProvider } from '../Pages'
import { getPageName } from './getPageName'

export type DetailPageProps =
	& SugaredQualifiedSingleEntity
	& EntitySubTreeAdditionalProps
	& {
		pageName?: string
		children: ReactNode
		rendererProps?: LayoutRendererProps
	}

const DetailPage: Partial<PageProvider<DetailPageProps>> & ComponentType<DetailPageProps> = memo(
	({ pageName, children, rendererProps, ...entityProps }: DetailPageProps) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<EntitySubTree {...entityProps}>
				<LayoutRenderer {...rendererProps}>
					{children}
				</LayoutRenderer>
			</EntitySubTree>
		</DataBindingProvider>
	),
)

DetailPage.displayName = 'DetailPage'
DetailPage.getPageName = getPageName

export { DetailPage }
