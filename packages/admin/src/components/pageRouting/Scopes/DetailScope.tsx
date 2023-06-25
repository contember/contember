import { DataBindingProvider, DataBindingProviderStateComponent, EntitySubTree, EntitySubTreeAdditionalProps, SugaredQualifiedSingleEntity } from '@contember/binding'
import { ReactNode } from 'react'
import { FeedbackRenderer } from '../../bindingFacade'
import { NotFoundBoundary } from './NotFoundBoundary'
import { scopeComponent } from './scopeComponent'

export type DetailScopeProps<StateProps> =
	& SugaredQualifiedSingleEntity
	& EntitySubTreeAdditionalProps
	& DataBindingProviderStateComponent<StateProps>
	& {
		children: ReactNode
	}
/**
 * @group Scopes
 */
export const DetailScope = scopeComponent(
	<StateProps, /*JSX FIX*/>({ children, stateComponent, stateProps, ...entityProps }: DetailScopeProps<StateProps>) => (
		<DataBindingProvider stateComponent={stateComponent ?? FeedbackRenderer} stateProps={stateProps}>
			<EntitySubTree {...entityProps}>
				<NotFoundBoundary>
					{children}
				</NotFoundBoundary>
			</EntitySubTree>
		</DataBindingProvider>
	),
	'DetailScope',
)
