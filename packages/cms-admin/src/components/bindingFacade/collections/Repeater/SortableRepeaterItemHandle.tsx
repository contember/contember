import * as React from 'react'
import { SortableHandle } from 'react-sortable-hoc'

export interface SortableRepeaterItemHandleProps {
	children: React.ReactNode
}

export const SortableRepeaterItemHandle = React.memo(
	SortableHandle(({ children }: SortableRepeaterItemHandleProps) => <>{children}</>),
)
SortableRepeaterItemHandle.displayName = 'SortableRepeaterItemHandle'
