import {
	Component,
	DataBindingExtendAborted,
	SugaredQualifiedEntityList,
	TreeRootId,
	useBindingOperations,
	useEnvironment,
} from '@contember/binding'
import { ComponentType, ReactElement, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import type { DataGridContainerProps, DataGridContainerPublicProps, DataGridState } from '../base'
import { useGridPagingState } from '../paging'
import { extractDataGridColumns } from '../structure'
import { renderGrid, RenderGridOptions } from './renderGrid'
import { useFilters } from './useFilters'
import { useHiddenColumnsState } from './useHiddenColumnsState'
import { useOrderBys } from './useOrderBys'
import { ContainerSpinner } from '@contember/ui'
import { useCurrentRequest } from '../../../../../routing'

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
		const { extendTree } = useBindingOperations()
		const isMountedRef = useRef(true)
		const environment = useEnvironment()

		const columns = useMemo(() => extractDataGridColumns(props.children), [props.children])

		const pageName = useCurrentRequest()?.pageName
		const entityName = typeof props.entities === 'string' ? props.entities : props.entities.entityName
		const dataGridKey = props.dataGridKey ?? `${pageName}__${entityName}`

		const [pageState, updatePaging] = useGridPagingState(props.itemsPerPage ?? null, dataGridKey)

		const [hiddenColumns, setIsColumnHidden] = useHiddenColumnsState(columns, dataGridKey)
		const [orderDirections, setOrderBy] = useOrderBys(columns, updatePaging, dataGridKey)
		const [filterArtifacts, setFilter] = useFilters(columns, updatePaging, dataGridKey)

		const containerProps: DataGridContainerPublicProps = useMemo(
			() => ({
				emptyMessageComponentExtraProps: props.emptyMessageComponentExtraProps,
				emptyMessage: props.emptyMessage,
				emptyMessageComponent: props.emptyMessageComponent,
			}),
			[props.emptyMessage, props.emptyMessageComponent, props.emptyMessageComponentExtraProps],
		)
		const gridOptions = useMemo(
			(): RenderGridOptions => ({
				entities: props.entities,
				setIsColumnHidden,
				updatePaging,
				setFilter,
				setOrderBy,
				containerProps,
			}),
			[props, setIsColumnHidden, updatePaging, setFilter, setOrderBy, containerProps],
		)

		const loadAbortControllerRef = useRef<AbortController | undefined>(undefined)

		const desiredState = useMemo(
			(): DataGridState => ({
				paging: pageState,
				columns,
				hiddenColumns,
				filterArtifacts,
				orderDirections,
			}),
			[pageState, columns, hiddenColumns, filterArtifacts, orderDirections],
		)

		const [displayedState, setDisplayedState] = useState<{
			gridState: DataGridState | undefined
			treeRootId: TreeRootId | undefined
		}>({
			gridState: undefined,
			treeRootId: undefined,
		})

		useEffect(() => {
			const extend = async () => {
				if (displayedState.gridState === desiredState) {
					return
				}
				loadAbortControllerRef.current?.abort()

				const newController = new AbortController()
				loadAbortControllerRef.current = newController

				let newTreeRootId: TreeRootId | undefined = undefined

				try {
					newTreeRootId = await extendTree(
						renderGrid(gridOptions, undefined, desiredState, desiredState, environment),
						{
							signal: newController.signal,
						},
					)
				} catch (e) {
					if (e === DataBindingExtendAborted) {
						return
					}
					throw e
				}
				if (!isMountedRef.current) {
					return
				}
				setDisplayedState({
					gridState: desiredState,
					treeRootId: newTreeRootId,
				})
			}
			extend()
		}, [desiredState, displayedState, environment, extendTree, gridOptions])

		useEffect(
			() => () => {
				isMountedRef.current = false
			},
			[],
		)
		if (!displayedState.gridState) {
			return <ContainerSpinner />
		}

		return renderGrid(
			gridOptions,
			displayedState.treeRootId,
			displayedState.gridState,
			desiredState,
			environment,
			'component' in props ? props.component : undefined,
			'componentProps' in props ? props.componentProps : undefined,
		)
	},
	() => {
		return null
	},
	'DataGrid',
) as <ComponentProps>(props: DataGridProps<ComponentProps>) => ReactElement
