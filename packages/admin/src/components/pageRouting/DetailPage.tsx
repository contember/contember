import {
	DataBindingProvider,
	EntitySubTree,
	EntitySubTreeAdditionalProps,
	SugaredQualifiedSingleEntity,
} from '@contember/binding'
import * as React from 'react'
import { FeedbackRenderer, ImmutableContentLayoutRendererProps, ImmutableSingleEntityRenderer } from '../bindingFacade'
import { PageProvider } from './PageProvider'

export interface DetailPageProps extends SugaredQualifiedSingleEntity, EntitySubTreeAdditionalProps {
	pageName: string
	children: React.ReactNode
	rendererProps?: Omit<ImmutableContentLayoutRendererProps, 'accessor'>
}

const DetailPage: Partial<PageProvider<DetailPageProps>> & React.ComponentType<DetailPageProps> = React.memo(
	({ pageName, children, rendererProps, ...entityProps }: DetailPageProps) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<EntitySubTree {...entityProps} entityComponent={ImmutableSingleEntityRenderer} entityProps={rendererProps}>
				{children}
			</EntitySubTree>
		</DataBindingProvider>
	),
)

DetailPage.displayName = 'DetailPage'
DetailPage.getPageName = (props: DetailPageProps) => props.pageName

export { DetailPage }
