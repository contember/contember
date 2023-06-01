import {
	DataBindingProvider,
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

export type CreateScopeProps =
	& Omit<SugaredUnconstrainedQualifiedSingleEntity, 'isCreating'>
	& EntitySubTreeAdditionalProps
	& EntitySubTreeAdditionalCreationProps
	& {
		children: ReactNode
		redirectOnSuccess?: RedirectOnSuccessTarget
	}

/**
 * @group Scopes
 */
export const CreateScope = scopeComponent(
	({ children, redirectOnSuccess, onPersistSuccess, ...entityProps }: CreateScopeProps) => {
		return (
			<DataBindingProvider stateComponent={FeedbackRenderer}>
				<EntitySubTree {...entityProps} onPersistSuccess={useOnPersistSuccess({ redirectOnSuccess, onPersistSuccess })} isCreating>
					{children}
				</EntitySubTree>
			</DataBindingProvider>
		)
	},
	'CreateScope',
)
