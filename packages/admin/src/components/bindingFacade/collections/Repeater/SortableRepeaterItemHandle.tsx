import { memo, ReactNode } from 'react'
import { SortableHandle } from 'react-sortable-hoc'

export interface SortableRepeaterItemHandleProps {
	children: ReactNode
}

export const SortableRepeaterItemHandle = memo(SortableHandle<SortableRepeaterItemHandleProps>(({ children }: SortableRepeaterItemHandleProps) => <>{children}</>))
SortableRepeaterItemHandle.displayName = 'SortableRepeaterItemHandle'
