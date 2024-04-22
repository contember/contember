import { ReactNode } from 'react'
import { Block, BlockProps } from '../../components'
import { Environment } from '@contember/react-binding'
import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'

type BlocksMap = Record<string, BlockProps>
export const extractBlocks = (children: ReactNode, env: Environment): BlocksMap => {
	const blocks = blockAnalyzer.processChildren(children, env)
	return Object.fromEntries(blocks.map(block => [block.name, block]))
}

const columnLeaf = new Leaf(node => node.props, Block)

const blockAnalyzer = new ChildrenAnalyzer<
	BlockProps,
	never,
	Environment
>([columnLeaf], {
	staticRenderFactoryName: 'staticRender',
	staticContextFactoryName: 'generateEnvironment',
	unhandledNodeErrorMessage: 'Only Block children are supported.',
})
