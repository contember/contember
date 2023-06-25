import {
	DataBindingProvider,
	DataBindingProviderStateComponent,
	EntitySubTree,
	EntitySubTreeAdditionalCreationProps,
	EntitySubTreeAdditionalProps,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '@contember/binding'
import { ReactNode } from 'react'
import { FeedbackRenderer } from '../../bindingFacade'
import { RedirectOnSuccessTarget } from '../useEntityRedirectOnPersistSuccess'
import { useOnPersistSuccess } from '../useOnPersistSuccess'
import { scopeComponent } from './scopeComponent'

export type CreateScopeProps<StateProps> =
	& Omit<SugaredUnconstrainedQualifiedSingleEntity, 'isCreating'>
	& EntitySubTreeAdditionalProps
	& EntitySubTreeAdditionalCreationProps
	& DataBindingProviderStateComponent<StateProps>
	& {
		children: ReactNode
		redirectOnSuccess?: RedirectOnSuccessTarget
	}

/**
 * @group Scopes
 */
export const CreateScope = scopeComponent(
	<StateProps, /*JSX FIX*/>({
		children,
		redirectOnSuccess,
		onPersistSuccess,
		stateComponent,
		stateProps,
		...entityProps
	}: CreateScopeProps<StateProps>) => {
		return (
			<DataBindingProvider stateComponent={stateComponent ?? FeedbackRenderer} stateProps={stateProps}>
				<EntitySubTree {...entityProps} onPersistSuccess={useOnPersistSuccess({ redirectOnSuccess, onPersistSuccess })} isCreating>
					{children}
				</EntitySubTree>
			</DataBindingProvider>
		)
	},
	'CreateScope',
)
