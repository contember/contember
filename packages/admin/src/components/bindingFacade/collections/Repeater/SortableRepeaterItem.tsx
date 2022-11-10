import { memo, ReactNode } from 'react'
import { SortableElement, SortableElementProps } from 'react-sortable-hoc'

export interface SortableRepeaterItemProps {
	children: ReactNode
}

export const SortableRepeaterItem = memo(SortableElement<SortableRepeaterItemProps>(({ children }: SortableRepeaterItemProps) => <>{children}</>))
SortableRepeaterItem.displayName = 'SortableRepeaterItem'
