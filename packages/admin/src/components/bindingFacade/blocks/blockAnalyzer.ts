import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import { Environment } from '@contember/binding'
import { Block, BlockProps } from './Block'

const blockLeaf = new Leaf((props: BlockProps): BlockProps => props, Block)

export const blockAnalyzer = new ChildrenAnalyzer<BlockProps, never, Environment>([blockLeaf], {
	ignoreUnhandledNodes: false,
	staticRenderFactoryName: 'staticRender',
	unhandledNodeErrorMessage: 'Only Block children are supported.',
})
