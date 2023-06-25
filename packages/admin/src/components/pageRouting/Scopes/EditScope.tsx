import { DataBindingProvider, DataBindingProviderStateComponent, EntitySubTree, EntitySubTreeAdditionalProps, SugaredQualifiedSingleEntity } from '@contember/binding'
import { ReactNode } from 'react'
import { FeedbackRenderer } from '../../bindingFacade'
import { RedirectOnSuccessTarget } from '../useEntityRedirectOnPersistSuccess'
import { useOnPersistSuccess } from '../useOnPersistSuccess'
import { NotFoundBoundary } from './NotFoundBoundary'
import { scopeComponent } from './scopeComponent'

export type EditScopeProps<StateProps> =
	& SugaredQualifiedSingleEntity
	& EntitySubTreeAdditionalProps
	& DataBindingProviderStateComponent<StateProps>
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
	<StateProps, /*JSX FIX*/>({
		children,
		onPersistSuccess,
		redirectOnSuccess,
		refreshDataBindingOnPersist,
		skipBindingStateUpdateAfterPersist,
		stateComponent,
		stateProps,
		...entityProps
	}: EditScopeProps<StateProps>) => (
		<DataBindingProvider
			refreshOnPersist={refreshDataBindingOnPersist ?? true}
			stateComponent={stateComponent ?? FeedbackRenderer}
			stateProps={stateProps}
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
