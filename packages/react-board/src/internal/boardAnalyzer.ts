import { Environment } from '@contember/binding'
import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import { BoardItem } from '../components/BoardItem'
import { ReactNode } from 'react'
import { BoardColumn } from '../components/BoardColumn'

const itemLeaf = new Leaf(node => ({ type: 'item' as const, children: node.props.children }), BoardItem)
const columnLeaf = new Leaf(node => ({ type: 'column' as const, children: node.props.children }), BoardColumn)

export const boardAnalyzer = new ChildrenAnalyzer<
	{ type: 'column' | 'item', children: ReactNode },
	never,
	Environment
>([itemLeaf, columnLeaf], {
	staticRenderFactoryName: 'staticRender',
	staticContextFactoryName: 'generateEnvironment',
})
