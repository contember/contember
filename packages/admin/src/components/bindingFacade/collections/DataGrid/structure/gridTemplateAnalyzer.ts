import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import type { ReactNode } from 'react'
import { DataGridColumn, DataGridColumnProps, DataGridColumns } from '../base'

class BoxedGridColumnProps {
	public constructor(public readonly value: DataGridColumnProps) {}
}

const gridColumnLeaf = new Leaf(node => new BoxedGridColumnProps(node.props), DataGridColumn)

const gridTemplateAnalyzer = new ChildrenAnalyzer<BoxedGridColumnProps>([gridColumnLeaf], {
	ignoreUnhandledNodes: false,
	unhandledNodeErrorMessage: `DataGrid: encountered an illegal child node.`,
})

export const extractDataGridColumns = (nodes: ReactNode): DataGridColumns => {
	const processed = gridTemplateAnalyzer.processChildren(nodes, undefined)
	return new Map(processed.map((column, i) => [`col_${i}`, column.value])) // todo: support custom stable column key
}
