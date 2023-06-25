import { DataBindingProvider, DataBindingProviderStateComponent } from '@contember/binding'
import { PropsWithChildren } from 'react'
import { DataGrid, DataGridProps, FeedbackRenderer } from '../../bindingFacade'
import { scopeComponent } from './scopeComponent'

export type DataGridScopeProps<StateProps> =
	& PropsWithChildren<DataGridProps<{}>>
	& DataBindingProviderStateComponent<StateProps>

/**
 * @group Scopes
 */
export const DataGridScope = scopeComponent(
	<StateProps, /*JSX FIX*/>({ stateComponent, stateProps, ...props }: DataGridScopeProps<StateProps>) => (
		<DataBindingProvider stateComponent={stateComponent ?? FeedbackRenderer} stateProps={stateProps}>
			<DataGrid {...props} />
		</DataBindingProvider>
	),
	'DataGridScope',
)
