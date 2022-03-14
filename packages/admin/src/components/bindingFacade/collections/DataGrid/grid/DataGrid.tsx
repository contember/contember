import { Component, SugaredQualifiedEntityList } from '@contember/binding'
import { ComponentType, ReactElement, ReactNode } from 'react'
import { ControlledDataGrid } from './ControlledDataGrid'
import { DataGridContainerProps, DataGridContainerPublicProps, useDataGrid } from '../base'

export type DataGridProps<ComponentExtraProps extends {}> =
	& DataGridContainerPublicProps
	& {
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

export const DataGrid = Component(
	<ComponentProps extends {}>(props: DataGridProps<ComponentProps>) => {
		return <ControlledDataGrid {...useDataGrid(props)} />
	},
	() => {
		return null
	},
	'DataGrid',
) as <ComponentProps>(props: DataGridProps<ComponentProps>) => ReactElement
