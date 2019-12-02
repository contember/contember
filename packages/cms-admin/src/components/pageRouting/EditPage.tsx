import * as React from 'react'
import { SingleEntityDataProvider } from '../../binding/coreComponents'
import { MutableSingleEntityRenderer, MutableSingleEntityRendererProps } from '../bindingFacade'
import { PageProvider } from './PageProvider'
import { SingleEntityPageProps } from './SingleEntityPageProps'

export interface EditPageProps extends SingleEntityPageProps {
	rendererProps?: Omit<MutableSingleEntityRendererProps, 'children'>
}

const EditPage: Partial<PageProvider<EditPageProps>> & React.ComponentType<EditPageProps> = React.memo(
	({ pageName, children, rendererProps, ...entityProps }: EditPageProps) => (
		<SingleEntityDataProvider {...entityProps}>
			<MutableSingleEntityRenderer {...rendererProps}>{children}</MutableSingleEntityRenderer>
		</SingleEntityDataProvider>
	),
)

EditPage.displayName = 'EditPage'
EditPage.getPageName = (props: EditPageProps) => props.pageName

export { EditPage }
