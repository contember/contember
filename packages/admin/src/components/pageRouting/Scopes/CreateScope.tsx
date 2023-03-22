import {
	EntitySubTree,
	EntitySubTreeAdditionalCreationProps,
	EntitySubTreeAdditionalProps,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '@contember/binding'
import { ComponentType, ReactNode, memo } from 'react'
import type { PageProvider } from '../Pages'
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

export const CreateScope: Partial<PageProvider<CreateScopeProps>> & ComponentType<CreateScopeProps> = memo(
	({ children, redirectOnSuccess, onPersistSuccess, ...entityProps }: CreateScopeProps) => {
		return (
			<EntitySubTree {...entityProps} onPersistSuccess={useOnPersistSuccess({ redirectOnSuccess, onPersistSuccess })} isCreating>
				{children}
			</EntitySubTree>
		)
	},
)

CreateScope.displayName = 'CreateScope'
