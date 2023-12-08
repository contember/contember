import { DataBindingProvider, DataBindingProviderStateComponent } from '@contember/react-binding'
import { PropsWithChildren } from 'react'
import { FeedbackRenderer } from '../../bindingFacade'
import { DataGrid, DataGridContainerPublicProps, DataGridProps } from '@contember/react-datagrid-ui'
import { scopeComponent } from './scopeComponent'

export type DataGridScopeProps<StateProps> =
	& PropsWithChildren<DataGridProps<DataGridContainerPublicProps>>
	& DataBindingProviderStateComponent<StateProps>
	& {
		refreshDataBindingOnPersist?: boolean
		skipBindingStateUpdateAfterPersist?: boolean
	}

/**
 * @group Scopes
 */
export const DataGridScope = scopeComponent(
	<StateProps, >({ stateComponent, stateProps, skipBindingStateUpdateAfterPersist, refreshDataBindingOnPersist, ...props }: DataGridScopeProps<StateProps>) => (
		<DataBindingProvider
			stateComponent={stateComponent ?? FeedbackRenderer}
			stateProps={stateProps}
			skipStateUpdateAfterPersist={skipBindingStateUpdateAfterPersist}
			refreshOnPersist={refreshDataBindingOnPersist ?? true}
		>
			<DataGrid {...props} />
		</DataBindingProvider>
	),
	'DataGridScope',
)
