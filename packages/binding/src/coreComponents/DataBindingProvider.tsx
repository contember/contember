import * as React from 'react'
import { AccessorTree, AccessorTreeState, useAccessorTreeState } from '../accessorTree'

export interface DataBindingProviderBaseProps {
	children?: React.ReactNode
}

export interface DataBindingStateComponentProps {
	accessorTreeState: AccessorTreeState
	children?: React.ReactNode
}

export type DataBindingProviderProps<StateProps> = DataBindingProviderBaseProps &
	(
		| {}
		| {
				stateComponent: React.ComponentType<StateProps & DataBindingStateComponentProps>
				stateProps?: StateProps
		  }
	)

export const DataBindingProvider = React.memo(function DataBindingProvider<
	StateProps extends DataBindingStateComponentProps
>(props: DataBindingProviderProps<StateProps>) {
	const accessorTreeState = useAccessorTreeState({
		nodeTree: props.children,
	})

	const children =
		'stateComponent' in props && props.stateComponent
			? React.createElement(
					props.stateComponent,
					{
						...props.stateProps!,
						accessorTreeState: accessorTreeState,
					},
					props.children,
			  )
			: props.children
	return <AccessorTree state={accessorTreeState}>{children}</AccessorTree>
}) as <StateProps>(props: DataBindingProviderProps<StateProps>) => React.ReactElement
