import { ComponentType, createElement, memo, ReactElement, ReactNode } from 'react'
import { AccessorTree, AccessorTreeState, AccessorTreeStateOptions, useDataBinding } from '../accessorTree'
import { TreeRootIdProvider } from '../accessorPropagation'
import { EntityKeyContext } from '../accessorPropagation/EntityKeyContext'
import { useDataBindingNg } from '../accessorTree/useDataBindingNg'

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
		<DataBindingInnerProvider accessorTreeState={accessorTreeState}>
			{children}
		</DataBindingInnerProvider>
	)
}) as <StateProps>(props: DataBindingProviderProps<StateProps>) => ReactElement

export type DataBindingNgProviderProps<StateProps> =
	& {
		children?: ReactNode
	}
	& DataBindingProviderStateComponent<StateProps>

export const DataBindingNgProvider = memo(function DataBindingProvider<StateProps extends DataBindingStateComponentProps>(
	props: DataBindingNgProviderProps<StateProps>,
) {
	const accessorTreeState = useDataBindingNg(props)

	const children = createElement(
		props.stateComponent,
		{
			...props.stateProps!,
			accessorTreeState: accessorTreeState,
		},
		props.children,
	)

	return (
		<DataBindingInnerProvider accessorTreeState={accessorTreeState}>
			{children}
		</DataBindingInnerProvider>
	)
}) as <StateProps>(props: DataBindingNgProviderProps<StateProps>) => ReactElement


const DataBindingInnerProvider = (
	{ accessorTreeState, children }: {
		children: ReactNode
		accessorTreeState: AccessorTreeState
	},
) => {
	return (
		<TreeRootIdProvider treeRootId={undefined}>
			<EntityKeyContext.Provider value={undefined}>
				<AccessorTree state={accessorTreeState}>
					{children}
				</AccessorTree>
			</EntityKeyContext.Provider>
		</TreeRootIdProvider>
	)
}
