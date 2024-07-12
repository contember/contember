import { Component, Environment } from '@contember/interface'
import { Table, TableBody, TableHeader, TableRow } from '../ui/table'
import * as React from 'react'
import { Fragment, ReactNode, useState } from 'react'
import { DataViewEachRow, DataViewLayout } from '@contember/react-dataview'
import { SheetIcon } from 'lucide-react'
import { dict } from '../dict'
import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import { DataGridColumnLeaf, DataGridColumnLeafProps } from './columns'

export interface DataViewTableProps {
	children: ReactNode
}

export const DataGridTable = Component<DataViewTableProps>(({ children }) => {
	return (
		<DataViewLayout name="table" label={<>
			<SheetIcon className={'w-3 h-3'} />
			<span>{dict.datagrid.showTable}</span>
		</>}>
			<div className={'rounded-md border overflow-x-auto'}>
				<DataGridTableRenderer>
					{children}
				</DataGridTableRenderer>
			</div>
		</DataViewLayout>
	)
})

const DataGridTableRenderer = Component< DataViewTableProps>(({ children }, env) => {
	const [columns] = useState(() => datagridColumnsAnalyzer.processChildren(children, env))
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
				<DataViewEachRow>
					<TableRow>
						{columns.map(({ cell, name }, i) => (
							<Fragment key={name ?? `_${i}`}>
								{cell}
							</Fragment>
						))}
					</TableRow>
				</DataViewEachRow>
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
