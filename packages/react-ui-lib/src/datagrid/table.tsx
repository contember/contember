import { Component, Environment } from '@contember/interface'
import { DataViewEachRow, DataViewEmpty, DataViewLayout, DataViewNonEmpty } from '@contember/react-dataview'
import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import { SheetIcon } from 'lucide-react'
import { Fragment, ReactNode, useMemo } from 'react'
import { dict } from '../dict'
import { Table, TableBody, TableHeader, TableRow } from '../ui/table'
import { DataGridColumnLeaf, DataGridColumnLeafProps } from './column-leaf'

const columnLeaf = new Leaf(node => node.props, DataGridColumnLeaf)

const dataGridColumnsAnalyzer = new ChildrenAnalyzer<
	DataGridColumnLeafProps,
	never,
	Environment
>([columnLeaf], {
	staticRenderFactoryName: 'staticRender',
	staticContextFactoryName: 'generateEnvironment',
})

const DataGridTableRenderer = Component<DataViewTableProps>(({ children }, env) => {
	const columns = useMemo(() => dataGridColumnsAnalyzer.processChildren(children, env), [children, env])

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
}, ({ children }) => <>{children}</>)


/**
 * Props for the {@link DataGridTable} component.
 */
export type DataViewTableProps = {
	children: ReactNode
}

/**
 * `DataGridTable` provides a table layout for `DataView`, allowing structured data representation.
 * It must be used within a `DataView` context to function correctly.
 *
 * #### Example: Basic usage
 * ```tsx
 * <DataGridTable>
 *   <DataGridTextColumn header="Title" field="title" />
 *   <DataGridTextColumn header="Author" field="author" />
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
			<div className="relative rounded-md border border-gray-200  overflow-y-auto">
				<DataGridTableRenderer>
					{children}
				</DataGridTableRenderer>
			</div>
		</DataViewLayout>
	)
})
