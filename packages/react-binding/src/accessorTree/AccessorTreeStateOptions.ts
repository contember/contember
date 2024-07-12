import type { ReactNode } from 'react'

export interface AccessorTreeStateOptions {
	children?: ReactNode
	refreshOnPersist?: boolean
	skipStateUpdateAfterPersist?: boolean
}
