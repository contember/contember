import { Component, Environment } from '@contember/interface'
import { DataViewEachRow, DataViewEmpty, DataViewLayout, DataViewNonEmpty } from '@contember/react-dataview'
import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import { SheetIcon } from 'lucide-react'
import * as React from 'react'
import { Fragment, ReactNode, useMemo } from 'react'
import { dict } from '../dict'
import { Table, TableBody, TableHeader, TableRow } from '../ui/table'

import { DataGridColumnLeaf, DataGridColumnLeafProps } from './column-leaf'

/**
 * Props for the {@link DataGridTable} component.
 */
export interface DataViewTableProps {
	children: ReactNode
}

/**
 * Table layout for DataView.
 *
 * ## Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridTextColumn header="Title" field="title" />
 * </DataGridTable>
 * ```
 */
export const DataGridTable = Component<DataViewTableProps>(({ children }) => {
	return (
		<DataViewLayout
			name="table"
			label={<>
				<SheetIcon className="w-3 h-3" />
				<span>{dict.datagrid.showTable}</span>
			</>}
		>
			<div className="relative rounded-md border overflow-y-auto">
				<DataGridTableRenderer>
					{children}
				</DataGridTableRenderer>
			</div>
		</DataViewLayout>
	)
})

const DataGridTableRenderer = Component<DataViewTableProps>(({ children }, env) => {
	const columns = useMemo(() => datagridColumnsAnalyzer.processChildren(children, env), [children, env])
	return (
		<Table>
			<TableHeader>
				<TableRow>
					{columns.map(({ header, name }, i) => (
						<Fragment key={name ?? `_${i}`}>
							{header}
						</Fragment>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>
				<DataViewNonEmpty>
					<DataViewEachRow>
						<TableRow>
							{columns.map(({ cell, name }, i) => (
								<Fragment key={name ?? `_${i}`}>
									{cell}
								</Fragment>
							))}
						</TableRow>
					</DataViewEachRow>
				</DataViewNonEmpty>
				<DataViewEmpty>
					<TableRow>
						<td className="text-lg p-4 text-center text-gray-400" colSpan={columns.length}>{dict.datagrid.empty}</td>
					</TableRow>
				</DataViewEmpty>
			</TableBody>
		</Table>
	)
}, ({ children }) => {
	return <>{children}</>
})

const columnLeaf = new Leaf(node => node.props, DataGridColumnLeaf)

const datagridColumnsAnalyzer = new ChildrenAnalyzer<
	DataGridColumnLeafProps,
	never,
	Environment
>([columnLeaf], {
	staticRenderFactoryName: 'staticRender',
	staticContextFactoryName: 'generateEnvironment',
})
