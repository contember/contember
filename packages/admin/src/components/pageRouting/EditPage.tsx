import {
	DataBindingProvider,
	EntitySubTree,
	EntitySubTreeAdditionalProps,
	SugaredQualifiedSingleEntity,
} from '@contember/binding'
import * as React from 'react'
import { FeedbackRenderer, MutableContentLayoutRendererProps, MutableSingleEntityRenderer } from '../bindingFacade'
import { PageProvider } from './PageProvider'

export interface EditPageProps extends SugaredQualifiedSingleEntity, EntitySubTreeAdditionalProps {
	pageName: string
	children: React.ReactNode
	rendererProps?: Omit<MutableContentLayoutRendererProps, 'accessor'>
}

const EditPage: Partial<PageProvider<EditPageProps>> & React.ComponentType<EditPageProps> = React.memo(
	({ pageName, children, rendererProps, ...entityProps }: EditPageProps) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<EntitySubTree {...entityProps} entityComponent={MutableSingleEntityRenderer} entityProps={rendererProps}>
				{children}
			</EntitySubTree>
		</DataBindingProvider>
	),
)

EditPage.displayName = 'EditPage'
EditPage.getPageName = (props: EditPageProps) => props.pageName

export { EditPage }
