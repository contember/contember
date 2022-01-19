import {
	DataBindingProvider,
	EntitySubTree,
	EntitySubTreeAdditionalCreationProps,
	EntitySubTreeAdditionalProps,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '@contember/binding'
import { ComponentType, memo, ReactNode } from 'react'
import { FeedbackRenderer, LayoutRenderer, LayoutRendererProps, PersistButton } from '../../bindingFacade'
import type { PageProvider } from '../Pages'
import { RedirectOnSuccessHandler } from '../useEntityRedirectOnPersistSuccess'
import { useOnPersistSuccess } from '../useOnPersistSuccess'
import { getPageName } from './getPageName'

export type CreatePageProps =
	& Omit<SugaredUnconstrainedQualifiedSingleEntity, 'isCreating'>
	& EntitySubTreeAdditionalProps
	& EntitySubTreeAdditionalCreationProps
	& {
		pageName?: string
		children: ReactNode
		redirectOnSuccess?: RedirectOnSuccessHandler
		rendererProps?: LayoutRendererProps
	}

const CreatePage: Partial<PageProvider<CreatePageProps>> & ComponentType<CreatePageProps> = memo(
	({ pageName, children, rendererProps, redirectOnSuccess, onPersistSuccess, ...entityProps }: CreatePageProps) => {
		return (
			<DataBindingProvider stateComponent={FeedbackRenderer}>
				<EntitySubTree {...entityProps} onPersistSuccess={useOnPersistSuccess({ redirectOnSuccess, onPersistSuccess })} isCreating>
					<LayoutRenderer {...rendererProps} actions={rendererProps?.actions ?? <PersistButton />}>
						{children}
					</LayoutRenderer>
				</EntitySubTree>
			</DataBindingProvider>
		)
	},
)

CreatePage.displayName = 'CreatePage'
CreatePage.getPageName = getPageName

export { CreatePage }
