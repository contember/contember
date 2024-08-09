import type { Environment } from '../environment'
import type { TreeRootId } from '../treeParameters'

export interface ExtendTreeOptions {
	signal?: AbortSignal
	environment?: Environment
	force?: boolean
}

export type ExtendTree<Node> = (newFragment: Node, options?: ExtendTreeOptions) => Promise<TreeRootId | undefined>
