import { lcfirst } from 'cms-common'
import * as React from 'react'
import { SingleEntityDataProvider } from '../../binding/coreComponents'
import { MutableSingleEntityRenderer, MutableSingleEntityRendererProps } from '../bindingFacade'
import { PageProvider } from './PageProvider'
import { SingleEntityPageProps } from './SingleEntityPageProps'

interface EditPageProps extends SingleEntityPageProps {
	rendererProps?: Omit<MutableSingleEntityRendererProps, 'children'>
}

const EditPage: Partial<PageProvider<EditPageProps>> & React.ComponentType<EditPageProps> = React.memo(
	(props: EditPageProps) => (
		<SingleEntityDataProvider where={props.where} entityName={props.entityName}>
			<MutableSingleEntityRenderer {...props.rendererProps}>{props.children}</MutableSingleEntityRenderer>
		</SingleEntityDataProvider>
	),
)

EditPage.displayName = 'EditPage'
EditPage.getPageName = (props: EditPageProps) => props.pageName || `edit_${lcfirst(props.entityName)}`

export { EditPage }
