import { lcfirst } from 'cms-common'
import * as React from 'react'
import { SingleEntityDataProvider } from '../../binding/coreComponents'
import { DefaultRenderer, DefaultRendererProps } from '../bindingFacade'
import { PageProvider } from './PageProvider'
import { SingleEntityPageProps } from './SingleEntityPageProps'

interface EditPageProps extends SingleEntityPageProps {
	rendererProps?: Omit<DefaultRendererProps, 'children'>
}

const EditPage: Partial<PageProvider<EditPageProps>> & React.ComponentType<EditPageProps> = React.memo(
	(props: EditPageProps) => (
		<SingleEntityDataProvider where={props.where} entityName={props.entityName}>
			<DefaultRenderer {...props.rendererProps}>{props.children}</DefaultRenderer>
		</SingleEntityDataProvider>
	),
)

EditPage.getPageName = (props: EditPageProps) => props.pageName || `edit_${lcfirst(props.entityName)}`

export { EditPage }

