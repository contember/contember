import { ComponentType, createElement, memo, ReactElement, ReactNode } from 'react'
import { AccessorTree, AccessorTreeState, useDataBinding } from '../accessorTree'

export interface DataBindingProviderBaseProps {
	children?: ReactNode
	refreshOnPersist?: boolean
}

export interface DataBindingStateComponentProps {
	accessorTreeState: AccessorTreeState
	children?: ReactNode
}

export type DataBindingProviderProps<StateProps> = DataBindingProviderBaseProps &
	(
		| {}
		| {
				stateComponent: ComponentType<StateProps & DataBindingStateComponentProps>
				stateProps?: StateProps
		  }
	)

export const DataBindingProvider = memo(function DataBindingProvider<StateProps extends DataBindingStateComponentProps>(
	props: DataBindingProviderProps<StateProps>,
) {
	const accessorTreeState = useDataBinding({
		nodeTree: props.children,
		refreshOnPersist: props.refreshOnPersist ?? false,
	})

	const children =
		'stateComponent' in props && props.stateComponent
			? createElement(
					props.stateComponent,
					{
						...props.stateProps!,
						accessorTreeState: accessorTreeState,
					},
					props.children,
			  )
			: props.children
	return <AccessorTree state={accessorTreeState}>{children}</AccessorTree>
}) as <StateProps>(props: DataBindingProviderProps<StateProps>) => ReactElement
