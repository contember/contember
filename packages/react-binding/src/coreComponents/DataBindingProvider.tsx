import { ComponentType, createElement, memo, ReactElement, ReactNode } from 'react'
import { AccessorTree, AccessorTreeState, useDataBinding } from '../accessorTree'

export type DataBindingProviderStateComponent<StateProps> = {
	stateComponent: ComponentType<StateProps & DataBindingStateComponentProps>
	stateProps?: StateProps
}

export interface DataBindingStateComponentProps {
	accessorTreeState: AccessorTreeState
	children?: ReactNode
}

export type DataBindingProviderProps<StateProps> =
	& {
		refreshOnPersist?: boolean
		skipStateUpdateAfterPersist?: boolean
		children?: ReactNode
	}
	& DataBindingProviderStateComponent<StateProps>


/**
 * The `DataBindingProvider` is a root component for all other data binding related components.
 *
 * @example
 * ```
 * <DataBindingProvider stateComponent={FeedbackRenderer} />
 * ```
 *
 * @group Data binding
 */
export const DataBindingProvider = memo(function DataBindingProvider<StateProps extends DataBindingStateComponentProps>(
	props: DataBindingProviderProps<StateProps>,
) {
	const accessorTreeState = useDataBinding(props)

	const children = createElement(
		props.stateComponent,
		{
			...props.stateProps!,
			accessorTreeState: accessorTreeState,
		},
		props.children,
	)
	return (
		<AccessorTree state={accessorTreeState}>
			{children}
		</AccessorTree>
	)
}) as <StateProps>(props: DataBindingProviderProps<StateProps>) => ReactElement
