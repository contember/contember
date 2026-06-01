import type { Environment } from '../environment/index.js'
import type { TreeRootId } from '../treeParameters/index.js'

export interface ExtendTreeOptions {
	signal?: AbortSignal
	environment?: Environment
	force?: boolean
	onError?: (error: Error) => void
}

export type ExtendTree<Node> = (newFragment: Node, options?: ExtendTreeOptions) => Promise<TreeRootId | undefined>
