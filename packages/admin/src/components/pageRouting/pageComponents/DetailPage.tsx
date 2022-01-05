import {
	DataBindingProvider,
	EntitySubTree,
	EntitySubTreeAdditionalProps,
	SugaredQualifiedSingleEntity,
} from '@contember/binding'
import { ComponentType, memo, ReactNode } from 'react'
import {
	FeedbackRenderer,
	ImmutableSingleEntityPageRenderer,
	ImmutableSingleEntityPageRendererProps,
} from '../../bindingFacade'
import type { PageProvider } from '../Pages'

export type DetailPageProps =
	& SugaredQualifiedSingleEntity
	& EntitySubTreeAdditionalProps
	& {
		pageName: string
		children: ReactNode
		rendererProps?: ImmutableSingleEntityPageRendererProps
	}

const DetailPage: Partial<PageProvider<DetailPageProps>> & ComponentType<DetailPageProps> = memo(
	({ pageName, children, rendererProps, ...entityProps }: DetailPageProps) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<EntitySubTree {...entityProps} entityComponent={ImmutableSingleEntityPageRenderer} entityProps={rendererProps}>
				{children}
			</EntitySubTree>
		</DataBindingProvider>
	),
)

DetailPage.displayName = 'DetailPage'
DetailPage.getPageName = (props: DetailPageProps) => props.pageName

export { DetailPage }
