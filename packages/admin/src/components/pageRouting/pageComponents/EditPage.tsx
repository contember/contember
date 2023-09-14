import {
	DataBindingProvider,
	EntitySubTree,
	EntitySubTreeAdditionalProps,
	SugaredQualifiedSingleEntity,
} from '@contember/react-binding'
import { ReactNode } from 'react'
import { FeedbackRenderer, LayoutRenderer, LayoutRendererProps, PersistButton } from '../../bindingFacade'
import { RedirectOnSuccessTarget } from '../useEntityRedirectOnPersistSuccess'
import { useOnPersistSuccess } from '../useOnPersistSuccess'
import { NotFoundWrapper } from './NotFoundWrapper'
import { pageComponent } from './pageComponent'

export type EditPageProps =
	& SugaredQualifiedSingleEntity
	& EntitySubTreeAdditionalProps
	& {
		pageName?: string
		children: ReactNode
		redirectOnSuccess?: RedirectOnSuccessTarget
		rendererProps?: LayoutRendererProps
		refreshDataBindingOnPersist?: boolean
		skipBindingStateUpdateAfterPersist?: boolean
	}

/**
 * @example
 * ```
 * <EditPage
 *   entity="Article(id = $id)"
 *   rendererProps={{ title: 'Edit article' }}
 * >
 *   <TextField label="Name" name="name" />
 * </EditPage>
 * ```
 *
 * @group Pages
 */
export const EditPage = pageComponent(
	({ pageName, children, rendererProps, redirectOnSuccess, onPersistSuccess, refreshDataBindingOnPersist, skipBindingStateUpdateAfterPersist, ...entityProps }: EditPageProps) => (
		<DataBindingProvider
			stateComponent={FeedbackRenderer}
			refreshOnPersist={refreshDataBindingOnPersist ?? true}
			skipStateUpdateAfterPersist={skipBindingStateUpdateAfterPersist}
		>
			<EntitySubTree {...entityProps} onPersistSuccess={useOnPersistSuccess({ redirectOnSuccess, onPersistSuccess })}>
				<NotFoundWrapper title={rendererProps?.title}>
					<LayoutRenderer {...rendererProps} actions={rendererProps?.actions ?? <PersistButton />}>
						{children}
					</LayoutRenderer>
				</NotFoundWrapper>
			</EntitySubTree>
		</DataBindingProvider>
	),
	'EditPage',
)
