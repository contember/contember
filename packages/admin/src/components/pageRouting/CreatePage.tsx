import {
	DataBindingProvider,
	EntitySubTree,
	EntitySubTreeAdditionalCreationProps,
	EntitySubTreeAdditionalProps,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '@contember/binding'
import { ComponentType, memo, ReactNode } from 'react'
import { FeedbackRenderer, MutableContentLayoutRendererProps, MutableSingleEntityRenderer } from '../bindingFacade'
import type { PageProvider } from './Pages'
import { RedirectOnSuccessHandler } from './useEntityRedirectOnPersistSuccess'
import { useOnPersistSuccess } from './useOnPersistSuccess'

export type CreatePageProps = Omit<SugaredUnconstrainedQualifiedSingleEntity, 'isCreating'> &
	EntitySubTreeAdditionalProps &
	EntitySubTreeAdditionalCreationProps & {
		pageName: string
		children: ReactNode
		redirectOnSuccess?: RedirectOnSuccessHandler
		rendererProps?: Omit<MutableContentLayoutRendererProps, 'accessor'>
	}

const CreatePage: Partial<PageProvider<CreatePageProps>> & ComponentType<CreatePageProps> = memo(
	({ pageName, children, rendererProps, redirectOnSuccess, onPersistSuccess, ...entityProps }: CreatePageProps) => {
		return (
			<DataBindingProvider stateComponent={FeedbackRenderer}>
				<EntitySubTree
					{...entityProps}
					entityComponent={MutableSingleEntityRenderer}
					entityProps={rendererProps}
					onPersistSuccess={useOnPersistSuccess({ redirectOnSuccess, onPersistSuccess })}
					isCreating
				>
					{children}
				</EntitySubTree>
			</DataBindingProvider>
		)
	},
)

CreatePage.displayName = 'CreatePage'
CreatePage.getPageName = (props: CreatePageProps) => props.pageName

export { CreatePage }
