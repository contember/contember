import {
	DataBindingProvider,
	EntitySubTree,
	EntitySubTreeAdditionalCreationProps,
	EntitySubTreeAdditionalProps,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '@contember/react-binding'
import { ReactNode } from 'react'
import { FeedbackRenderer, LayoutRenderer, LayoutRendererProps, PersistButton } from '../../bindingFacade'
import { RedirectOnSuccessTarget } from '../useEntityRedirectOnPersistSuccess'
import { useOnPersistSuccess } from '../useOnPersistSuccess'
import { pageComponent } from './pageComponent'

export type CreatePageProps =
	& Omit<SugaredUnconstrainedQualifiedSingleEntity, 'isCreating'>
	& EntitySubTreeAdditionalProps
	& EntitySubTreeAdditionalCreationProps
	& {
		pageName?: string
		children: ReactNode
		redirectOnSuccess?: RedirectOnSuccessTarget
		rendererProps?: LayoutRendererProps
	}

/**
 * @example
 * ```
 * <CreatePage
 *   entity="Article"
 *   redirectOnSuccess="articleEdit(id: $entity.id)"
 *   rendererProps={{ title: 'Create article' }}
 * >
 *   <TextField label="Name" name="name" />
 * </CreatePage>
 * ```
 *
 * @group Pages
 */
export const CreatePage = pageComponent(
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
	'CreatePage',
)
