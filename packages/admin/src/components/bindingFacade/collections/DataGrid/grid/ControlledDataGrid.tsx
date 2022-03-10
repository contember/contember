import { Component, SugaredQualifiedEntityList, useEnvironment } from '@contember/binding'
import { ComponentType, ReactElement, ReactNode, useMemo } from 'react'
import type { DataGridContainerProps, DataGridContainerPublicProps } from '../base'
import { DataGridState, DataGridStateMethods } from '../base'
import { renderGrid } from './renderGrid'
import { ContainerSpinner } from '@contember/ui'
import { useDataGridDisplayedState } from '../base/useDataGridDisplayedState'

export type ControlledDataGridProps<ComponentExtraProps extends {}> =
	& DataGridContainerPublicProps
	& {
		state: DataGridState,
		stateMethods: DataGridStateMethods
		dataGridKey?: string

		entities: SugaredQualifiedEntityList['entities']
		children: ReactNode
		itemsPerPage?: number | null
	}
	& (
		| {}
		| {
			component: ComponentType<DataGridContainerProps & ComponentExtraProps>
			componentProps: ComponentExtraProps
		}
	)


export const ControlledDataGrid = Component(
	<ComponentProps extends {}>({ state, stateMethods, ...props }: ControlledDataGridProps<ComponentProps>) => {
		const containerProps: DataGridContainerPublicProps = useMemo(
			() => ({
				emptyMessageComponentExtraProps: props.emptyMessageComponentExtraProps,
				emptyMessage: props.emptyMessage,
				emptyMessageComponent: props.emptyMessageComponent,
			}),
			[props.emptyMessage, props.emptyMessageComponent, props.emptyMessageComponentExtraProps],
		)


		const displayedState = useDataGridDisplayedState(stateMethods, state)
		const environment = useEnvironment()

		if (!displayedState.gridState) {
			return <ContainerSpinner />
		}

		return renderGrid(
			stateMethods,
			displayedState.treeRootId,
			displayedState.gridState,
			state,
			environment,
			containerProps,
			'component' in props ? props.component : undefined,
			'componentProps' in props ? props.componentProps : undefined,
		)
	},
	() => {
		return null
	},
	'ControlledDataGrid',
) as <ComponentProps>(props: ControlledDataGridProps<ComponentProps>) => ReactElement
