import * as React from 'react'
import { Environment } from '../dao'

export interface ExtendTreeOptions {
	signal?: AbortSignal
	environment?: Environment
}

export type ExtendTree = (newFragment: React.ReactNode, options?: ExtendTreeOptions) => Promise<void>
