import { Component, SugaredQualifiedEntityList, useEnvironment } from '@contember/binding'
import { ContainerSpinner } from '@contember/ui'
import { ComponentType, ReactElement, ReactNode, useMemo } from 'react'
import type { DataGridContainerProps, DataGridContainerPublicProps } from '../base'
import { DataGridState, DataGridStateMethods } from '../base'
import { useDataGridDisplayedState } from '../base/useDataGridDisplayedState'
import { renderGrid } from './renderGrid'

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
				emptyMessage: props.emptyMessage,
				emptyMessageComponent: props.emptyMessageComponent,
				emptyMessageComponentExtraProps: props.emptyMessageComponentExtraProps,
				onEntityClick: props.onEntityClick,
				selectedEntityIds: props.selectedEntityIds,
				tile: props.tile,
			}),
			[
				props.emptyMessage,
				props.emptyMessageComponent,
				props.emptyMessageComponentExtraProps,
				props.onEntityClick,
				props.selectedEntityIds,
				props.tile,
			],
		)


		const displayedState = useDataGridDisplayedState(stateMethods, state, props.tile)
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
	({ state, stateMethods, ...props }, environment) => {
		return renderGrid(
			stateMethods,
			undefined,
			state,
			state,
			environment,
			{
				tile: props.tile,
			},
			'component' in props ? props.component : undefined,
			'componentProps' in props ? props.componentProps : undefined,
		)
	},
	'ControlledDataGrid',
) as <ComponentProps>(props: ControlledDataGridProps<ComponentProps>) => ReactElement
