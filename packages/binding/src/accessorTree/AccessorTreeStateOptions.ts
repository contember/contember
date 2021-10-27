import type { ReactNode } from 'react'

export interface AccessorTreeStateOptions {
	nodeTree: ReactNode
	refreshOnEnvironmentChange?: boolean
	refreshOnPersist?: boolean
}
