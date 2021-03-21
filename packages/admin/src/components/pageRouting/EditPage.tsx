import {
	DataBindingProvider,
	EntityAccessor,
	EntitySubTree,
	EntitySubTreeAdditionalProps,
	PersistSuccessOptions,
	SugaredQualifiedSingleEntity,
} from '@contember/binding'
import { ComponentType, memo, ReactNode } from 'react'
import RequestState from '../../state/request'
import { FeedbackRenderer, MutableContentLayoutRendererProps, MutableSingleEntityRenderer } from '../bindingFacade'
import { PageProvider } from './PageProvider'
import { useEntityRedirectOnPersistSuccess } from './useEntityRedirectOnPersistSuccess'

export interface EditPageProps extends SugaredQualifiedSingleEntity, EntitySubTreeAdditionalProps {
	pageName: string
	children: ReactNode
	redirectOnSuccess?: (
		currentState: RequestState,
		persistedId: string,
		entity: EntityAccessor,
		options: PersistSuccessOptions,
	) => RequestState
	rendererProps?: Omit<MutableContentLayoutRendererProps, 'accessor'>
}

const EditPage: Partial<PageProvider<EditPageProps>> & ComponentType<EditPageProps> = memo(
	({ pageName, children, rendererProps, redirectOnSuccess, ...entityProps }: EditPageProps) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<EntitySubTree
				{...entityProps}
				entityComponent={MutableSingleEntityRenderer}
				entityProps={rendererProps}
				onPersistSuccess={useEntityRedirectOnPersistSuccess(redirectOnSuccess)}
			>
				{children}
			</EntitySubTree>
		</DataBindingProvider>
	),
)

EditPage.displayName = 'EditPage'
EditPage.getPageName = (props: EditPageProps) => props.pageName

export { EditPage }
