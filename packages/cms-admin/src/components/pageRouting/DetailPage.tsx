import * as React from 'react'
import { SingleEntityDataProvider } from '../../binding/coreComponents'
import { ImmutableSingleEntityRenderer, ImmutableSingleEntityRendererProps } from '../bindingFacade'
import { PageProvider } from './PageProvider'
import { SingleEntityPageProps } from './SingleEntityPageProps'

export interface DetailPageProps extends SingleEntityPageProps {
	rendererProps?: Omit<ImmutableSingleEntityRendererProps, 'children'>
}

const DetailPage: Partial<PageProvider<DetailPageProps>> & React.ComponentType<DetailPageProps> = React.memo(
	({ pageName, children, rendererProps, ...entityProps }: DetailPageProps) => (
		<SingleEntityDataProvider {...entityProps}>
			<ImmutableSingleEntityRenderer {...rendererProps}>{children}</ImmutableSingleEntityRenderer>
		</SingleEntityDataProvider>
	),
)

DetailPage.displayName = 'DetailPage'
DetailPage.getPageName = (props: DetailPageProps) => props.pageName

export { DetailPage }
