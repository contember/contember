import { DataBindingProvider } from '@contember/binding'
import { PropsWithChildren } from 'react'
import { DataGrid, DataGridProps, FeedbackRenderer } from '../../bindingFacade'
import { scopeComponent } from './scopeComponent'

export type DataGridScopeProps = PropsWithChildren<DataGridProps<{}>>

/**
 * @group Scopes
 */
export const DataGridScope = scopeComponent(
	(props: DataGridScopeProps) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<DataGrid {...props} />
		</DataBindingProvider>
	),
	'DataGridScope',
)
