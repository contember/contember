import { DataBindingProvider, EntitySubTree, EntitySubTreeAdditionalProps, SugaredQualifiedSingleEntity } from '@contember/binding'
import { ReactNode } from 'react'
import { FeedbackRenderer } from '../../bindingFacade'
import { NotFoundBoundary } from './NotFoundBoundary'
import { scopeComponent } from './scopeComponent'

export type DetailScopeProps =
	& SugaredQualifiedSingleEntity
	& EntitySubTreeAdditionalProps
	& {
		children: ReactNode
	}
/**
 * @group Scopes
 */
export const DetailScope = scopeComponent(
	({ children, ...entityProps }: DetailScopeProps) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<EntitySubTree {...entityProps}>
				<NotFoundBoundary>
					{children}
				</NotFoundBoundary>
			</EntitySubTree>
		</DataBindingProvider>
	),
	'DetailScope',
)

