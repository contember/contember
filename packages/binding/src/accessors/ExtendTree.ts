import * as React from 'react'

export interface ExtendTreeOptions {
	signal?: AbortSignal
}

export type ExtendTree = (newFragment: React.ReactNode, options?: ExtendTreeOptions) => Promise<void>
