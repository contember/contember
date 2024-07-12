import { ComponentType, createElement, memo, ReactElement, ReactNode } from 'react'
import { AccessorTree, AccessorTreeState, AccessorTreeStateOptions, useDataBinding } from '../accessorTree'
import { TreeRootIdProvider } from '../accessorPropagation'
import { EntityKeyContext } from '../accessorPropagation/EntityKeyContext'

export type DataBindingProviderStateComponent<StateProps> = (
	| {
		stateComponent?: never;
		stateProps?: never;
	}
	| {
		stateComponent: ComponentType<StateProps & DataBindingStateComponentProps>
		stateProps?: StateProps
	}
)

export type DataBindingProviderBaseProps =
	& AccessorTreeStateOptions

export interface DataBindingStateComponentProps {
	accessorTreeState: AccessorTreeState
	children?: ReactNode
}

export type DataBindingProviderProps<StateProps> =
	& DataBindingProviderBaseProps
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
	return (
		<TreeRootIdProvider treeRootId={undefined}>
			<EntityKeyContext.Provider value={undefined}>
				<AccessorTree state={accessorTreeState}>
					{children}
				</AccessorTree>
			</EntityKeyContext.Provider>
		</TreeRootIdProvider>
	)
}) as <StateProps>(props: DataBindingProviderProps<StateProps>) => ReactElement
