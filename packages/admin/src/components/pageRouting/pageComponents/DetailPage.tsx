import {
	DataBindingProvider,
	EntitySubTree,
	EntitySubTreeAdditionalProps,
	SugaredQualifiedSingleEntity,
} from '@contember/react-binding'
import { ReactNode } from 'react'
import { FeedbackRenderer, LayoutRenderer, LayoutRendererProps } from '../../bindingFacade'
import { pageComponent } from './pageComponent'

export type DetailPageProps =
	& SugaredQualifiedSingleEntity
	& EntitySubTreeAdditionalProps
	& {
		pageName?: string
		children: ReactNode
		rendererProps?: LayoutRendererProps
	}

/**
 * @group Pages
 */
export const DetailPage = pageComponent(
	({ pageName, children, rendererProps, ...entityProps }: DetailPageProps) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<EntitySubTree {...entityProps}>
				<LayoutRenderer {...rendererProps}>
					{children}
				</LayoutRenderer>
			</EntitySubTree>
		</DataBindingProvider>
	),
	'DetailPage',
)
