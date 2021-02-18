import * as React from 'react'
import { Environment } from '../dao'
import { TreeRootId } from '../treeParameters'

export interface ExtendTreeOptions {
	signal?: AbortSignal
	environment?: Environment
}

export type ExtendTree = (newFragment: React.ReactNode, options?: ExtendTreeOptions) => Promise<TreeRootId | undefined>
