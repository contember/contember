import type { Environment } from '../dao'
import type { TreeRootId } from '../treeParameters'

export interface ExtendTreeOptions {
	signal?: AbortSignal
	environment?: Environment
}

export type ExtendTree<Node> = (newFragment: Node, options?: ExtendTreeOptions) => Promise<TreeRootId | undefined>
