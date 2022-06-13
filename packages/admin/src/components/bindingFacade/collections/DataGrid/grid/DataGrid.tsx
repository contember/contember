import { Component, QueryLanguage, SugaredQualifiedEntityList } from '@contember/binding'
import { ComponentType, ReactElement, ReactNode } from 'react'
import { DataGridContainerProps, DataGridContainerPublicProps, DataGridState, useDataGrid } from '../base'
import { extractDataGridColumns } from '../structure'
import { ControlledDataGrid } from './ControlledDataGrid'
import { renderGrid } from './renderGrid'

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
	(props, environment) => {
		const columns = extractDataGridColumns(props.children)
		const fakeState: DataGridState = {
			columns,
			paging: {
				itemsPerPage: props.itemsPerPage ?? null,
				pageIndex: 0,
			},
			hiddenColumns: {},
			filterArtifacts: {},
			orderDirections: {},
			orderBy: [],
			entities: QueryLanguage.desugarQualifiedEntityList({ entities: props.entities }, environment),
			filter: { and: [{}] },
			layout: 'default',
		}

		return renderGrid(
			{ setFilter: () => null, setIsColumnHidden: () => null, setOrderBy: () => null, updatePaging: () => null, setLayout: () => null },
			undefined,
			fakeState,
			fakeState,
			environment,
			{
				tile: props.tile,
			},
			'component' in props ? props.component : undefined,
			'componentProps' in props ? props.componentProps : undefined,
		)
	},
	'DataGrid',
) as <ComponentProps>(props: DataGridProps<ComponentProps>) => ReactElement
