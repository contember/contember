import { Block, BlockProps } from '../../components'
import { Environment } from '@contember/react-binding'
import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'

const columnLeaf = new Leaf(node => node.props, Block)

export const blockAnalyzer = new ChildrenAnalyzer<
	BlockProps,
	never,
	Environment
>([columnLeaf], {
	staticRenderFactoryName: 'staticRender',
	staticContextFactoryName: 'generateEnvironment',
	// unhandledNodeErrorMessage: 'Only Block children are supported.',
})
