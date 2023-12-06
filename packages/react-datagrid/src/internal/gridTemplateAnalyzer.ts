import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import type { ReactNode } from 'react'
import { DataGridColumnProps, DataGridColumns } from '../types'
import { DataGridColumn } from '../grid'
import { Environment } from '@contember/react-binding'

class BoxedGridColumnProps {
	public constructor(public readonly value: DataGridColumnProps) {}
}

const gridColumnLeaf = new Leaf(node => new BoxedGridColumnProps(node.props), DataGridColumn)

const gridTemplateAnalyzer = new ChildrenAnalyzer<BoxedGridColumnProps, never, Environment>([gridColumnLeaf], {
	ignoreUnhandledNodes: false,
	unhandledNodeErrorMessage: `DataGrid: encountered an illegal child node.`,
})

export const extractDataGridColumns = (nodes: ReactNode, env: Environment): DataGridColumns<any> => {
	const processed = gridTemplateAnalyzer.processChildren(nodes, env)

	let counter = 0
	const suffixes: Record<string, number> = {}

	const getColumnKey = (column: DataGridColumnProps) => {
		if (column.columnKey) {
			return column.columnKey
		}
		if (!('field' in column) || typeof (column as { field: unknown }).field !== 'string') {
			return `column__${++counter}`
		}
		const name = (column as { field: string }).field
		if (name in suffixes) {
			return `${name}_${++suffixes[name]}`
		}
		suffixes[name] = 0
		return name
	}

	return new Map(processed.map(column => {
		const key = getColumnKey(column.value)

		return [key, column.value]
	}))
}
