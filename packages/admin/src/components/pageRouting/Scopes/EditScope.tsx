import {
	DataBindingProvider,
	EntitySubTree,
	EntitySubTreeAdditionalProps,
	SugaredQualifiedSingleEntity,
} from '@contember/binding'
import { ComponentType, ReactNode, memo } from 'react'
import { FeedbackRenderer } from '../../bindingFacade'
import type { PageProvider } from '../Pages'
import { RedirectOnSuccessTarget } from '../useEntityRedirectOnPersistSuccess'
import { useOnPersistSuccess } from '../useOnPersistSuccess'
import { NotFoundBoundary } from './NotFoundBoundary'

export type EditScopeProps =
	& SugaredQualifiedSingleEntity
	& EntitySubTreeAdditionalProps
	& {
		pageName?: string
		children: ReactNode
		redirectOnSuccess?: RedirectOnSuccessTarget
		refreshDataBindingOnPersist?: boolean
		skipBindingStateUpdateAfterPersist?: boolean
	}

export const EditScope: Partial<PageProvider<EditScopeProps>> & ComponentType<EditScopeProps> = memo(
	({ pageName, children, redirectOnSuccess, onPersistSuccess, refreshDataBindingOnPersist, skipBindingStateUpdateAfterPersist, ...entityProps }: EditScopeProps) => (
		<DataBindingProvider
			stateComponent={FeedbackRenderer}
			refreshOnPersist={refreshDataBindingOnPersist ?? true}
			skipStateUpdateAfterPersist={skipBindingStateUpdateAfterPersist}
		>
			<EntitySubTree {...entityProps} onPersistSuccess={useOnPersistSuccess({ redirectOnSuccess, onPersistSuccess })}>
				<NotFoundBoundary>
					{children}
				</NotFoundBoundary>
			</EntitySubTree>
		</DataBindingProvider>
	),
)

EditScope.displayName = 'EditScope'
