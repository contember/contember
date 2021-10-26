import {
	DataBindingProvider,
	EntitySubTree,
	EntitySubTreeAdditionalProps,
	SugaredQualifiedSingleEntity,
} from '@contember/binding'
import { ComponentType, memo, ReactNode } from 'react'
import { FeedbackRenderer, MutableContentLayoutRendererProps, MutableSingleEntityRenderer } from '../bindingFacade'
import type { PageProvider } from './Pages'
import { RedirectOnSuccessHandler } from './useEntityRedirectOnPersistSuccess'
import { useOnPersistSuccess } from './useOnPersistSuccess'

export interface EditPageProps extends SugaredQualifiedSingleEntity, EntitySubTreeAdditionalProps {
	pageName: string
	children: ReactNode
	redirectOnSuccess?: RedirectOnSuccessHandler
	rendererProps?: Omit<MutableContentLayoutRendererProps, 'accessor'>
	refreshDataBindingOnPersist?: boolean
}

const EditPage: Partial<PageProvider<EditPageProps>> & ComponentType<EditPageProps> = memo(
	({ pageName, children, rendererProps, redirectOnSuccess, onPersistSuccess, refreshDataBindingOnPersist, ...entityProps }: EditPageProps) => (
		<DataBindingProvider stateComponent={FeedbackRenderer} refreshOnPersist={refreshDataBindingOnPersist ?? true}>
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
