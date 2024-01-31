import { Environment } from '@contember/binding'
import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import { BoardItem } from '../components/BoardItem'
import { ReactNode } from 'react'
import { BoardColumn } from '../components/BoardColumn'

const itemLeaf = new Leaf(node => node.props.children, BoardItem)
const columnLeaf = new Leaf(node => node.props.children, BoardColumn)


export const boardColumnsAnalyzer = new ChildrenAnalyzer<
	ReactNode,
	never,
	Environment
>([columnLeaf], {
	staticRenderFactoryName: 'staticRender',
})

export const boardItemsAnalyzer = new ChildrenAnalyzer<
	ReactNode,
	never,
	Environment
>([itemLeaf], {
	staticRenderFactoryName: 'staticRender',
})
