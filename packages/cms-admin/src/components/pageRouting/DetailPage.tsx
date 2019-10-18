import { lcfirst } from 'cms-common'
import * as React from 'react'
import { SingleEntityDataProvider } from '../../binding/coreComponents'
import { ImmutableSingleEntityRenderer, ImmutableSingleEntityRendererProps } from '../bindingFacade'
import { PageProvider } from './PageProvider'
import { SingleEntityPageProps } from './SingleEntityPageProps'

export interface DetailPageProps extends SingleEntityPageProps {
	rendererProps?: Omit<ImmutableSingleEntityRendererProps, 'children'>
}

const DetailPage: Partial<PageProvider<DetailPageProps>> & React.ComponentType<DetailPageProps> = React.memo(
	(props: DetailPageProps) => (
		<SingleEntityDataProvider where={props.where} entityName={props.entityName}>
			<ImmutableSingleEntityRenderer {...props.rendererProps}>{props.children}</ImmutableSingleEntityRenderer>
		</SingleEntityDataProvider>
	),
)

DetailPage.displayName = 'DetailPage'
DetailPage.getPageName = (props: DetailPageProps) => props.pageName || `detail_${lcfirst(props.entityName)}`

export { DetailPage }
