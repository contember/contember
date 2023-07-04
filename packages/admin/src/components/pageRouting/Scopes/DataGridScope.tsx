import { DataBindingProvider, DataBindingProviderStateComponent } from '@contember/react-binding'
import { PropsWithChildren } from 'react'
import { FeedbackRenderer } from '../../bindingFacade'
import { DataGrid, DataGridProps } from '@contember/react-datagrid-ui'
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
