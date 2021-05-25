import type { ReactNode } from 'react'
import type { Environment } from '../dao'
import type { TreeRootId } from '../treeParameters'

export interface ExtendTreeOptions {
	signal?: AbortSignal
	environment?: Environment
}

export type ExtendTree = (newFragment: ReactNode, options?: ExtendTreeOptions) => Promise<TreeRootId | undefined>
