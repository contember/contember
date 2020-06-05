import { DataBindingProvider, SingleEntitySubTree, SugaredQualifiedSingleEntity } from '@contember/binding'
import * as React from 'react'
import { FeedbackRenderer, MutableContentLayoutRenderer, MutableContentLayoutRendererProps } from '../bindingFacade'
import { PageProvider } from './PageProvider'

export interface EditPageProps extends SugaredQualifiedSingleEntity {
	pageName: string
	children: React.ReactNode
	rendererProps?: Omit<MutableContentLayoutRendererProps, 'accessor'>
}

const EditPage: Partial<PageProvider<EditPageProps>> & React.ComponentType<EditPageProps> = React.memo(
	({ pageName, children, rendererProps, ...entityProps }: EditPageProps) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<SingleEntitySubTree {...entityProps} entityComponent={MutableContentLayoutRenderer} entityProps={rendererProps}>
				{children}
			</SingleEntitySubTree>
		</DataBindingProvider>
	),
)

EditPage.displayName = 'EditPage'
EditPage.getPageName = (props: EditPageProps) => props.pageName

export { EditPage }
