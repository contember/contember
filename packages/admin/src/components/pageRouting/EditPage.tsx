import {
	DataBindingProvider,
	EntitySubTree,
	EntitySubTreeAdditionalProps,
	SugaredQualifiedSingleEntity,
} from '@contember/binding'
import { ComponentType, memo, ReactNode } from 'react'
import { FeedbackRenderer, MutableContentLayoutRendererProps, MutableSingleEntityRenderer } from '../bindingFacade'
import type { PageProvider } from './PageProvider'
import { RedirectOnSuccessHandler } from './useEntityRedirectOnPersistSuccess'
import { useOnPersistSuccess } from './useOnPersistSuccess'

export interface EditPageProps extends SugaredQualifiedSingleEntity, EntitySubTreeAdditionalProps {
	pageName: string
	children: ReactNode
	redirectOnSuccess?: RedirectOnSuccessHandler
	rendererProps?: Omit<MutableContentLayoutRendererProps, 'accessor'>
}

const EditPage: Partial<PageProvider<EditPageProps>> & ComponentType<EditPageProps> = memo(
	({ pageName, children, rendererProps, redirectOnSuccess, onPersistSuccess, ...entityProps }: EditPageProps) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<EntitySubTree
				{...entityProps}
				entityComponent={MutableSingleEntityRenderer}
				entityProps={rendererProps}
				onPersistSuccess={useOnPersistSuccess({ redirectOnSuccess, onPersistSuccess })}
			>
				{children}
			</EntitySubTree>
		</DataBindingProvider>
	),
)

EditPage.displayName = 'EditPage'
EditPage.getPageName = (props: EditPageProps) => props.pageName

export { EditPage }
