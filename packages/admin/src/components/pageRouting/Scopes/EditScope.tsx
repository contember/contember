import { DataBindingProvider, EntitySubTree, EntitySubTreeAdditionalProps, SugaredQualifiedSingleEntity } from '@contember/binding'
import { ReactNode } from 'react'
import { FeedbackRenderer } from '../../bindingFacade'
import { RedirectOnSuccessTarget } from '../useEntityRedirectOnPersistSuccess'
import { useOnPersistSuccess } from '../useOnPersistSuccess'
import { NotFoundBoundary } from './NotFoundBoundary'
import { scopeComponent } from './scopeComponent'

export type EditScopeProps =
	& SugaredQualifiedSingleEntity
	& EntitySubTreeAdditionalProps
	& {
		children: ReactNode
		redirectOnSuccess?: RedirectOnSuccessTarget
		refreshDataBindingOnPersist?: boolean
		skipBindingStateUpdateAfterPersist?: boolean
	}

/**
 * @group Scopes
 */
export const EditScope = scopeComponent(
	({ children, redirectOnSuccess, onPersistSuccess, refreshDataBindingOnPersist, skipBindingStateUpdateAfterPersist, ...entityProps }: EditScopeProps) => (
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
	'EditScope',
)
