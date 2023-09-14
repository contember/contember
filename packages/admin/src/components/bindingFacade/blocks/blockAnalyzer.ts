import type { Environment } from '@contember/react-binding'
import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import { Block, BlockProps } from './Block'

const blockLeaf = new Leaf<BlockProps>(node => node.props, Block)

export const blockAnalyzer = new ChildrenAnalyzer<BlockProps, never, Environment>([blockLeaf], {
	ignoreUnhandledNodes: false,
	staticRenderFactoryName: 'staticRender',
	unhandledNodeErrorMessage: 'Only Block children are supported.',
})
