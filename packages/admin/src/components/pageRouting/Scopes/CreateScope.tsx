import {
	DataBindingProvider,
	EntitySubTree,
	EntitySubTreeAdditionalCreationProps,
	EntitySubTreeAdditionalProps,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '@contember/binding'
import { ComponentType, ReactNode, memo } from 'react'
import { FeedbackRenderer } from '../../bindingFacade'
import { RedirectOnSuccessTarget } from '../useEntityRedirectOnPersistSuccess'
import { useOnPersistSuccess } from '../useOnPersistSuccess'

export type CreateScopeProps =
	& Omit<SugaredUnconstrainedQualifiedSingleEntity, 'isCreating'>
	& EntitySubTreeAdditionalProps
	& EntitySubTreeAdditionalCreationProps
	& {
		children: ReactNode
		redirectOnSuccess?: RedirectOnSuccessTarget
	}

export const CreateScope: Partial<CreateScopeProps> & ComponentType<CreateScopeProps> = memo(
	({ children, redirectOnSuccess, onPersistSuccess, ...entityProps }: CreateScopeProps) => {
		return (
			<DataBindingProvider stateComponent={FeedbackRenderer}>
				<EntitySubTree {...entityProps} onPersistSuccess={useOnPersistSuccess({ redirectOnSuccess, onPersistSuccess })} isCreating>
					{children}
				</EntitySubTree>
			</DataBindingProvider>
		)
	},
)

CreateScope.displayName = 'CreateScope'
