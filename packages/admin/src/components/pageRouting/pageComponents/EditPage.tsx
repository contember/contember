import {
	DataBindingProvider,
	EntitySubTree,
	EntitySubTreeAdditionalProps,
	SugaredQualifiedSingleEntity,
} from '@contember/binding'
import { ComponentType, memo, ReactNode } from 'react'
import { FeedbackRenderer, LayoutRenderer, LayoutRendererProps, PersistButton } from '../../bindingFacade'
import type { PageProvider } from '../Pages'
import { RedirectOnSuccessHandler } from '../useEntityRedirectOnPersistSuccess'
import { useOnPersistSuccess } from '../useOnPersistSuccess'
import { NotFoundWrapper } from './NotFoundWrapper'

export type EditPageProps =
	& SugaredQualifiedSingleEntity
	& EntitySubTreeAdditionalProps
	& {
		pageName: string
		children: ReactNode
		redirectOnSuccess?: RedirectOnSuccessHandler
		rendererProps?: LayoutRendererProps
		refreshDataBindingOnPersist?: boolean
	}

const EditPage: Partial<PageProvider<EditPageProps>> & ComponentType<EditPageProps> = memo(
	({ pageName, children, rendererProps, redirectOnSuccess, onPersistSuccess, refreshDataBindingOnPersist, ...entityProps }: EditPageProps) => (
		<DataBindingProvider stateComponent={FeedbackRenderer} refreshOnPersist={refreshDataBindingOnPersist ?? true}>
			<EntitySubTree {...entityProps} onPersistSuccess={useOnPersistSuccess({ redirectOnSuccess, onPersistSuccess })}>
				<NotFoundWrapper title={rendererProps?.title}>
					<LayoutRenderer {...rendererProps} actions={rendererProps?.actions ?? <PersistButton />}>
						{children}
					</LayoutRenderer>
				</NotFoundWrapper>
			</EntitySubTree>
		</DataBindingProvider>
	),
)

EditPage.displayName = 'EditPage'
EditPage.getPageName = (props: EditPageProps) => props.pageName

export { EditPage }
