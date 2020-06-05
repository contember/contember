import { DataBindingProvider, SingleEntitySubTree, SugaredQualifiedSingleEntity } from '@contember/binding'
import * as React from 'react'
import { FeedbackRenderer, ImmutableContentLayoutRenderer, ImmutableContentLayoutRendererProps } from '../bindingFacade'
import { PageProvider } from './PageProvider'

export interface DetailPageProps extends SugaredQualifiedSingleEntity {
	pageName: string
	children: React.ReactNode
	rendererProps?: ImmutableContentLayoutRendererProps
}

const DetailPage: Partial<PageProvider<DetailPageProps>> & React.ComponentType<DetailPageProps> = React.memo(
	({ pageName, children, rendererProps, ...entityProps }: DetailPageProps) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<SingleEntitySubTree
				{...entityProps}
				entityComponent={ImmutableContentLayoutRenderer}
				entityProps={rendererProps}
			>
				{children}
			</SingleEntitySubTree>
		</DataBindingProvider>
	),
)

DetailPage.displayName = 'DetailPage'
DetailPage.getPageName = (props: DetailPageProps) => props.pageName

export { DetailPage }
