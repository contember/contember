import { useEnvironment } from '@contember/react-binding'
import { ActionableBox, Box, Dropdown, DropdownProps, TableHeaderCell } from '@contember/ui'
import { createElement, ReactElement, useCallback, useMemo } from 'react'
import { DataGridColumnProps } from '@contember/react-datagrid'
import { DataGridColumnPublicProps } from '../types'
import { Serializable } from '@contember/react-utils'
import { ChevronDownIcon, ChevronUpIcon, FilterIcon } from 'lucide-react'
import {
	useDataViewFilteringMethods,
	useDataViewFilteringState,
	useDataViewSortingMethods,
	useDataViewSortingState,
} from '@contember/react-dataview'


export type DataGridHeaderCellProps =
	& {
		columnKey: string
		column: DataGridColumnProps<Serializable, DataGridColumnPublicProps>
	}

export function DataGridHeaderCell(props: DataGridHeaderCellProps): ReactElement {
	const {
		columnKey,
		column: { header, headerJustification, justification, shrunk, ascOrderIcon, descOrderIcon },
	} = props
	const orderDirections = useDataViewSortingState().directions
	const { setOrderBy } = useDataViewSortingMethods()
	const orderDirection = orderDirections[columnKey]
	const orderColumns = Object.keys(orderDirections)
	const orderState = orderDirection ? {
		direction: orderDirection,
		index: orderColumns.length > 1 ? orderColumns.indexOf(columnKey) : undefined,
	} : undefined

	return (
		<TableHeaderCell scope="col" justification={headerJustification || justification} shrunk={shrunk}>
			<span style={{ display: 'flex', justifyContent: 'flex-start', gap: '.25em' }}>
				<span onClick={e => setOrderBy(columnKey, 'next', e.ctrlKey || e.metaKey)} style={{ cursor: 'pointer' }}>
					{header}
					&nbsp;
					{orderState &&
						<>
							{{
								asc: ascOrderIcon ?? defaultAscIcon,
								desc: descOrderIcon ?? defaultDescIcon,
							}[orderState.direction]}
							{orderState.index !== undefined ? `(${orderState.index + 1})` : null}
						</>}
				</span>
				<DataGridHeaderCellFilterDropdown {...props} />
			</span>
		</TableHeaderCell>
	)
}


const defaultAscIcon = <ChevronUpIcon />
const defaultDescIcon = <ChevronDownIcon />

export type DataGridHeaderCellFilterDropdownProps =
	& {
		columnKey: string
		column: DataGridColumnProps<Serializable, DataGridColumnPublicProps>
	}

export const DataGridHeaderCellFilterDropdown = (props: DataGridHeaderCellFilterDropdownProps) => {
	const environment = useEnvironment()
	const filterArtifact = useDataViewFilteringState().artifact[props.columnKey]
	const { setFilter: setFilterInner } = useDataViewFilteringMethods()

	const hasFilter = props.column.enableFiltering
		&& filterArtifact !== undefined
		&& props.column.getNewFilter(filterArtifact, { environment }) !== undefined

	const buttonProps: DropdownProps['buttonProps'] = useMemo(() => ({
		intent: hasFilter ? undefined : 'default',
		distinction: 'seamless',
		size: 'small',
		children: (
			<FilterIcon
				fill={hasFilter ? 'currentColor' : 'none'}
			/>
		),
	}), [hasFilter])

	const setFilter = useCallback((filter: Serializable | undefined) => {
		setFilterInner(props.columnKey, filter)
	}, [props.columnKey, setFilterInner])

	if (props.column.enableFiltering === false) {
		return null
	}

	const filter = filterArtifact ?? props.column.emptyFilter
	const filterRenderer = props.column.filterRenderer

	return (
		<Dropdown
			buttonProps={buttonProps}
			renderContent={({ requestClose }) => (
				<ActionableBox
					onRemove={() => {
						setFilter(undefined)
						requestClose()
					}}
				>
					<Box padding={false} background={false} border={false} header={<>Filter: {props.column.header}</>}>
						{createElement(filterRenderer, {
							filter,
							setFilter: setFilter,
							environment: environment,
						})}
					</Box>
				</ActionableBox>
			)}
		/>
	)
}
